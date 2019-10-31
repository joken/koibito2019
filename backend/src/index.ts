import 'reflect-metadata'
import { validate } from 'class-validator'
import connectRedis from 'connect-redis'
import Express, { Router } from 'express'
import session from 'express-session'
import IORedis from 'ioredis'
import moment from 'moment'
import schedule from 'node-schedule'
import Redis from 'redis'
import { createConnection } from 'typeorm'

import User, { Gender } from './entity/User'
import questions from './data/questions'
import matching from './matching'
import env from './env'

createConnection({
  type: 'mariadb',
  host: env.DATABASE_HOST,
  port: env.DATABASE_PORT,
  username: env.DATABASE_USER,
  password: env.DATABASE_PASS,
  database: env.DATABASE_NAME,
  synchronize: true,
  logging: false,
  entities: ['src/entity/**/*.ts'],
  migrations: ['src/migration/**/*.ts'],
  subscribers: ['src/subscriber/**/*.ts'],
  cli: {
    entitiesDir: 'src/entity',
    migrationsDir: 'src/migration',
    subscribersDir: 'src/subscriber'
  }
})
  .then(async connection => {
    const userRepository = connection.getRepository(User)
    let matched = false

    const redis = new IORedis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT
    })
    redis
      .get('matchedAt')
      .then(value => {
        if (value == null) {
          return
        }

        if (moment().isSame(moment(value), 'day')) {
          matched = true
        }
      })
      .catch(console.error)

    const matchingFinishedDetection = schedule.scheduleJob(
      '*/1 * * * *',
      () => {
        if (
          moment().isAfter(
            moment().set({
              hour: 15,
              minute: 0,
              second: 30,
              millisecond: 0
            })
          )
        ) {
          if (!matched) {
            matching(userRepository)
              .then(() => {
                matched = true
                redis
                  .set('matchedAt', moment().toISOString())
                  .catch(console.error)
              })
              .catch(console.error)
          } else {
            matchingFinishedDetection.cancel()
          }
        }
      }
    )

    const app = Express()

    app.use(Express.json())
    app.use(Express.urlencoded({ extended: true }))
    app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal'])

    const RedisStore = connectRedis(session)
    app.use(
      session({
        store: new RedisStore({
          client: Redis.createClient({
            host: env.REDIS_HOST,
            port: env.REDIS_PORT,
            prefix: env.SESSION_REDIS_PREFIX
          })
        }),
        secret: env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
          httpOnly: true,
          expires: moment()
            .endOf('day')
            .toDate(),
          secure: app.get('env') === 'production'
        }
      })
    )

    const router = Router()

    const todayQuestions = moment().isSame('2019-11-02', 'day')
      ? questions.day1
      : questions.day2

    router.get('/status', async (req, res) => {
      const canSubmit = moment().isBetween(
        moment().set({
          hour: 9,
          minute: 0,
          second: 0,
          millisecond: 0
        }),
        moment().set({
          hour: 15,
          minute: 0,
          second: 0,
          millisecond: 0
        })
      )

      const user = await userRepository.findOne({ id: req.session!.userId })

      res.status(200).send({
        canSubmit,
        matched,
        submitted: user != null
      })
    })

    router.get('/questions', (_req, res) => {
      return res.status(200).send(todayQuestions)
    })

    router.post('/submit', (req, res) => {
      if (
        !moment().isBefore(
          moment().set({
            hour: 15,
            minute: 0,
            second: 0,
            millisecond: 0
          })
        ) &&
        req.header('X-Force-Submit') !== 'true'
      ) {
        return res.status(403).send({ message: '回答時間外です' })
      }

      let user: User
      try {
        user = new User(req.body)
      } catch (e) {
        console.error(e)
        return res
          .status(500)
          .send({ message: '内部エラーが発生しました', errors: [e] })
      }

      if (user.answers.length !== todayQuestions.length) {
        console.error('アンケートの回答数が問題数と一致しません')
        return res
          .status(400)
          .send({ message: 'アンケートの回答数が問題数と一致しません' })
      }

      validate(user).then(errors => {
        if (errors.length > 0) {
          console.error('回答が不正な値です', errors)
          return res.status(400).send({ message: '回答が不正な値です', errors })
        } else {
          userRepository.findOne({ id: req.session!.userId }).then(value => {
            if (
              value != null &&
              req.header('X-Disable-Cookie-Check') !== 'true'
            ) {
              return res.status(400).send({
                message: 'すでに回答を送信済みです'
              })
            } else {
              userRepository
                .save(user)
                .then(user => {
                  req.session!.userId = user.id
                  return res.status(200).send({
                    user: {
                      name: user.name,
                      gender: user.gender,
                      age: user.age,
                      partnerGender: user.partnerGender,
                      partnerMinAge: user.partnerMinAge,
                      partnerMaxAge: user.partnerMaxAge,
                      answers: user.answers,
                      createdAt: user.createdAt,
                      updatedAt: user.updatedAt
                    }
                  })
                })
                .catch(reason => {
                  console.error(reason)
                  return res.status(500).send({
                    message: '内部エラーが発生しました',
                    errors: [{ reason }]
                  })
                })
            }
          })
        }
      })
    })

    router.get('/results', (req, res) => {
      if (!matched && req.header('X-Force-Get-Result') !== 'true') {
        return res.status(403).send({ message: '結果はまだありません' })
      } else if (req.session != null && req.session.userId != null) {
        userRepository
          .createQueryBuilder('user')
          .where('user.id = :id', { id: req.session.userId })
          .leftJoinAndSelect(User, 'partner', 'partner.id = user.partnerId')
          .getRawOne()
          .then(result => {
            if (result != null) {
              return res.status(200).send({
                name: result.user_name,
                partnerName: result.partner_name,
                partnerScore: result.user_partnerScore
              })
            }
          })
          .catch(reason => {
            return res.status(500).send({
              message: '内部エラーが発生しました',
              errors: [{ reason }]
            })
          })
      } else {
        return res
          .status(404)
          .send({ message: 'Cookieに該当するユーザーが見つかりません' })
      }
    })

    router.get('/debug/users', (req, res) => {
      userRepository
        .find()
        .then(users => {
          return res.send({ users })
        })
        .catch(reason => {
          console.error(reason)
          return res
            .status(500)
            .send({ message: '内部エラーが発生しました', errors: [{ reason }] })
        })
    })

    router.delete('/debug/users', (req, res) => {
      userRepository
        .createQueryBuilder()
        .delete()
        .from(User)
        .execute()
        .then(result => {
          return res.status(204).send({ result })
        })
        .catch(reason => {
          console.error(reason)
          return res
            .status(500)
            .send({ message: '内部エラーが発生しました', errors: [{ reason }] })
        })
    })

    router.post('/debug/users/generate', async (req, res) => {
      await userRepository
        .createQueryBuilder()
        .delete()
        .from(User)
        .execute()

      let amount = 100
      if (Number.isInteger(req.body.amount)) {
        amount = req.body.amount
      }
      const users: User[] = []

      for (let i = 0; i < amount; i++) {
        const partnerMinAge = Math.floor(Math.random() * (100 + 1))
        const partnerAgeRange = Math.floor(Math.random() * (100 + 1))
        const partnerMaxAge =
          partnerMinAge + partnerAgeRange > 100
            ? 100
            : partnerMinAge + partnerAgeRange
        users[i] = new User({
          name: `test${i}`,
          gender: Math.floor(Math.random() * (2 - 1 + 1) + 1) as Gender,
          age: Math.floor(Math.random() * (100 + 1)),
          partnerGender: Math.floor(Math.random() * (2 - 1 + 1) + 1) as Gender,
          partnerMinAge,
          partnerMaxAge,
          answers: todayQuestions.map(() =>
            Math.floor(Math.random() * (5 - 1 + 1) + 1)
          )
        })
      }

      userRepository
        .save(users)
        .then(users => {
          return res.status(200).send({ users })
        })
        .catch(reason => {
          console.error(reason)
          return res
            .status(500)
            .send({ message: '内部エラーが発生しました', errors: [{ reason }] })
        })
    })

    router.post('/debug/matching', (req, res) => {
      matching(userRepository)
        .then(users => {
          matched = true
          return res.status(200).send({ users })
        })
        .catch(reason => {
          console.error(reason)
          return res
            .status(500)
            .send({ message: '内部エラーが発生しました', errors: [{ reason }] })
        })
    })

    app.use('/api', router)

    app.listen(4000, () =>
      console.log('koibito2019 backend listening on port 4000!')
    )
  })
  .catch(error => console.log(error))
