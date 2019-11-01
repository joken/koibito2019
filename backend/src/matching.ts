import { Repository, Between } from 'typeorm'
import * as _ from 'lodash'
import moment from 'moment'
import User, { Gender } from './entity/User'

function euclideanDistance(xs: number[], ys: number[]): number {
  if (xs.length !== ys.length) {
    throw new Error('The lengths of a and b do not match.')
  }

  return Math.sqrt(
    _.zip(xs, ys).reduce((sum, xy) => {
      const x = xy[0]
      const y = xy[1]
      if (x != null && y != null) {
        return sum + Math.pow(x - y, 2)
      } else {
        throw new Error('xs or ys include null')
      }
    }, 0)
  )
}

export type UsersRank = {
  targetId: string
  distance: number
  score: number
}

type UsersRanks = {
  [key: string]: UsersRank[]
}

function generateUsersRanks(users: User[], targets: User[]): UsersRanks {
  return users.reduce<UsersRanks>((obj, user) => {
    const ranks = targets
      .map(target => {
        // 回答ベクトルのユークリッド距離
        const distance = euclideanDistance(user.answers, target.answers)
        // マッチング優先度のスコア 低いほど良い
        let score = distance + 1

        if (target.age < user.partnerMinAge) {
          score *=
            1 +
            (Math.abs(target.age - user.partnerMinAge) / 10) *
              (10 / Math.abs(user.partnerMinAge - user.partnerMaxAge))
        }
        if (target.age > user.partnerMaxAge) {
          score *=
            1 +
            (Math.abs(target.age - user.partnerMaxAge) / 10) *
              (10 / Math.abs(user.partnerMinAge - user.partnerMaxAge))
        }

        if (score > Number.MAX_VALUE) {
          score = Number.MAX_VALUE
        }
        if (score < Number.MIN_VALUE) {
          score = Number.MIN_VALUE
        }

        return {
          targetId: target.id,
          distance,
          score
        }
      })
      .sort((a, b) => (a.score > b.score ? 1 : b.score > a.score ? -1 : 0))

    return Object.assign(obj, {
      [user.id]: ranks
    })
  }, {})
}

async function matching(userRepository: Repository<User>): Promise<User[]> {
  console.group('Start matching')

  function GSMatching(
    users: User[],
    targets: User[],
    prevUsersRank?: UsersRanks,
    prevTargetsRank?: UsersRanks
  ) {
    const usersRank =
      prevUsersRank !== undefined
        ? prevUsersRank
        : generateUsersRanks(users, targets)
    const targetsRank =
      prevTargetsRank !== undefined
        ? prevTargetsRank
        : generateUsersRanks(targets, users)
    console.groupCollapsed('GSMatching', users, usersRank, targets, targetsRank)
    users.forEach((user, _, array) => {
      if (user.partnerId === null) {
        const targetInfo = usersRank[user.id].shift()
        console.debug('targetInfo', targetInfo)
        if (targetInfo == null) return

        const target = targets.find(value => value.id === targetInfo.targetId)
        console.debug('target', target)
        if (target == null) return

        const userInfo = targetsRank[target.id].find(
          value => value.targetId === user.id
        )
        console.debug('userInfo', userInfo)
        if (userInfo == null) return

        if (target.partnerId === null) {
          target.partnerId = user.id
          user.partnerId = target.id
          target.partnerDistance = targetInfo.distance
          user.partnerDistance = userInfo.distance
          target.partnerScore = userInfo.score
          user.partnerScore = targetInfo.score
          console.log(`${user.id} -> ${target.id}: OK`)
        } else if (
          targetsRank[target.id].findIndex(
            value => value.targetId === user.id
          ) <=
          targetsRank[target.id].findIndex(
            value => value.targetId === target.partnerId
          )
        ) {
          const targetsPartner = array.find(
            value => value.id === target.partnerId
          )
          if (targetsPartner == null) return

          targetsPartner.partnerId = null
          targetsPartner.partnerDistance = null
          targetsPartner.partnerScore = null
          target.partnerId = user.id
          user.partnerId = target.id
          target.partnerDistance = targetInfo.distance
          user.partnerDistance = userInfo.distance
          target.partnerScore = userInfo.score
          user.partnerScore = targetInfo.score
          console.log(`${user.id} -> ${target.id}: Change OK`)
        } else {
          console.log(`${user.id} -> ${target.id}: NG`)
        }
      }
    })
    console.groupEnd()

    if (users.some(user => user.partnerId === null)) {
      GSMatching(users, targets, usersRank, targetsRank)
    }
  }

  const users = await userRepository.find()
  users.forEach(user => {
    user.partnerId = null
    user.partnerDistance = null
    user.partnerScore = null
  })
  await userRepository.save(users)

  const M2MUsers = await userRepository.find({
    where: {
      gender: Gender.MALE,
      partnerGender: Gender.MALE,
      createdAt: Between(
        moment()
          .startOf('day')
          .toDate(),
        moment()
          .endOf('day')
          .toDate()
      )
    }
  })
  const M2MUsers2 = M2MUsers.splice(Math.floor(M2MUsers.length / 2))

  const M2MUsersRanks = generateUsersRanks(M2MUsers, M2MUsers2)
  M2MUsers.forEach(user => {
    user.targetRanks = M2MUsersRanks[user.id]
  })
  const M2MUsersRanks2 = generateUsersRanks(M2MUsers2, M2MUsers)
  M2MUsers2.forEach(user => {
    user.targetRanks = M2MUsersRanks2[user.id]
  })

  console.groupCollapsed('Matching M2M')
  GSMatching(M2MUsers, M2MUsers2)
  console.groupEnd()

  const F2FUsers = await userRepository.find({
    where: {
      gender: Gender.FEMALE,
      partnerGender: Gender.FEMALE,
      createdAt: Between(
        moment()
          .startOf('day')
          .toDate(),
        moment()
          .endOf('day')
          .toDate()
      )
    }
  })
  const F2FUsers2 = F2FUsers.splice(Math.floor(F2FUsers.length / 2))

  const F2FUsersRanks = generateUsersRanks(F2FUsers, F2FUsers2)
  F2FUsers.forEach(user => {
    user.targetRanks = F2FUsersRanks[user.id]
  })
  const F2FUsersRanks2 = generateUsersRanks(F2FUsers2, F2FUsers)
  F2FUsers2.forEach(user => {
    user.targetRanks = F2FUsersRanks2[user.id]
  })

  console.groupCollapsed('Matching F2F')
  GSMatching(F2FUsers, F2FUsers2)
  console.groupEnd()

  const M2FUsers = await userRepository.find({
    where: {
      gender: Gender.MALE,
      partnerGender: Gender.FEMALE,
      createdAt: Between(
        moment()
          .startOf('day')
          .toDate(),
        moment()
          .endOf('day')
          .toDate()
      )
    }
  })
  const F2MUsers = await userRepository.find({
    where: {
      gender: Gender.FEMALE,
      partnerGender: Gender.MALE,
      createdAt: Between(
        moment()
          .startOf('day')
          .toDate(),
        moment()
          .endOf('day')
          .toDate()
      )
    }
  })

  const M2FUsersRanks = generateUsersRanks(M2FUsers, F2MUsers)
  M2FUsers.forEach(user => {
    user.targetRanks = M2FUsersRanks[user.id]
  })
  const F2MUsersRanks = generateUsersRanks(F2MUsers, M2FUsers)
  F2MUsers.forEach(user => {
    user.targetRanks = F2MUsersRanks[user.id]
  })

  if (M2FUsers.length <= F2MUsers.length) {
    console.groupCollapsed('Matching M2F and F2M')
    GSMatching(M2FUsers, F2MUsers)
    console.groupEnd()
  } else {
    console.groupCollapsed('Matching F2M and M2F')
    GSMatching(F2MUsers, M2FUsers)
    console.groupEnd()
  }

  console.log('Finished matching')
  console.groupEnd()
  return userRepository.save(
    M2MUsers.concat(M2MUsers2, F2FUsers, F2FUsers2, M2FUsers, F2MUsers)
  )
}

export default matching
