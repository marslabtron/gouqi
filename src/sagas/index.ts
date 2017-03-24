import { take, put, call, fork } from 'redux-saga/effects'
import {
  AsyncStorage,
  InteractionManager
} from 'react-native'
import * as api from '../services/api'
import { getCookies, setCookies } from '../services/request'
import { Action } from 'redux-actions'
import {
  IUserInfo
} from '../interfaces'
import {
  toastAction,
  addSecondsAction
} from '../actions'
import { takeLatest } from 'redux-saga'
import watchSearch from './search'
import watchComment from './comment'
import watchPlaylist from './playlist'
import watchPlayer from './player'
import watchDownload from './download'
import watchPersonal from './personal'
import Router from '../routers'
import RNFS from 'react-native-fs'
import { getDownloadedTracks, FILES_FOLDER } from '../utils'

function* setProfile (profile) {
  yield AsyncStorage.setItem('PROFILE', JSON.stringify(profile))
  yield AsyncStorage.setItem('Cookies', getCookies())
  yield put({
    type: 'personal/profile',
    payload: profile
  })
}

function* getProfile () {
  const profile = yield call(AsyncStorage.getItem, 'PROFILE')
  yield put({
    type: 'personal/profile',
    payload: JSON.parse(profile)
  })
}

export function* loginFlow () {
  while (true) {
    const { payload = {
      username: '',
      password: ''
    } }: Action<IUserInfo> = yield take('user/login')
    const { username, password } = payload

    if (username && password) {
      yield put({
        type: 'user/login/start'
      })

      const userInfo = yield call(api.login, username.trim(), password.trim())

      yield put({
        type: 'user/login/end'
      })

      if (userInfo.code === 200) {
        yield Router.pop()
        yield call(InteractionManager.runAfterInteractions)
        yield put(toastAction('success', '你已成功登录'))
        yield fork(setProfile, userInfo.profile)
      } else {
        yield put(toastAction('warning', '帐号或密码错误'))
      }
    } else {
      yield put(toastAction('warning', '帐号或密码不能为空'))
    }
  }
}

function* recommandSaga () {
  const isLogin = !!api.getUserId()
  let promises = [
    api.topPlayList('30'),
    api.newAlbums('30'),
    api.topArtists('100')
  ]
  if (isLogin) {
    promises.push(api.dailyRecommend('30'))
  }

  yield put({
    type: 'home/recommend/start'
  })

  try {
    const [
      playlists,
      albums,
      artists,
      songs
    ] =  yield Promise.all(promises)

    if (playlists.code === 200) {
      yield put({
        type: 'playlists/sync',
        payload: playlists.playlists,
        meta: {
          more: true,
          offset: 0
        }
      })
    }

    if (albums.code === 200 && artists.code === 200) {
      yield put({
        type: 'home/recommend/save',
        payload: {
          albums: albums.albums,
          artists: artists.artists
        }
      })
    }

    if (songs.code === 200) {
      yield put({
        type: 'personal/daily/save',
        payload: songs.recommend
      })
    }

    yield put({
      type: 'home/recommend/end'
    })
  } catch (error) {
    yield put(toastAction('error', '网络出现错误..'))
  }
}

function* setCookiesSaga () {
  const Cookies: string = yield AsyncStorage.getItem('Cookies')

  if (Cookies && Cookies.includes(';')) {
    const expires = Cookies.split(';').find(c => c.includes('Expires'))
    if (expires) {
      if (new Date(expires) > new Date()) {
        setCookies(Cookies)
        yield put({
          type: 'personal/playlist'
        })
      } else {
        yield put(toastAction('info', '登录凭证已过期'))
        yield Router.toLogin()
      }
    }
  }
}

function* setDownloadTracksSaga () {
  const tracks = yield call(getDownloadedTracks)
  yield put({
    type: 'download/tracks/set',
    payload: tracks
  })
  yield call(RNFS.mkdir, FILES_FOLDER)
}

function* setSecondsSaga () {
  const seconds = yield call(AsyncStorage.getItem, 'SECONDS')
  yield put(addSecondsAction(Number(seconds)))
}

function* getHistory () {
  const history = yield call(AsyncStorage.getItem, 'HISTORY')
  yield put({
    type: 'player/history/save',
    payload: history ? JSON.parse(history) : []
  })
}

export function* init() {
  while (true) {
    yield take('app/init')

    yield* setCookiesSaga()

    yield* setDownloadTracksSaga()

    yield* setSecondsSaga()

    yield* getProfile()

    yield* getHistory()

    yield put({
      type: 'home/recommend'
    })
  }
}

export default function* root () {
  yield [
    fork(init),
    fork(loginFlow),
    fork(watchPlaylist),
    fork(watchSearch),
    fork(watchComment),
    fork(watchPlayer),
    fork(watchDownload),
    fork(watchPersonal),
    takeLatest('home/recommend', recommandSaga)
  ]
}
