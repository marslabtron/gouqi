import * as React from 'react'
import Popup from './PopupContainer'
import {
  Dimensions,
  View,
  ViewStyle,
  Text,
  ListView,
  StyleSheet,
  TouchableHighlight,
  TouchableWithoutFeedback,
  TextStyle
} from 'react-native'
import { ITrack } from '../services/api'
import CustomIcon from '../components/icon'
import Icon from 'react-native-vector-icons/FontAwesome'
import { Color, centering } from '../styles'
import Ionic from 'react-native-vector-icons/Ionicons'
import { connect } from 'react-redux'
import {
  setModeAction,
  playTrackAction,
  hidePlaylistPopup,
  setPlaylistTracks,
  removePlaylist,
  clearPlaylist,
  showBatchOpsModal
} from '../actions'
import BatchOps from '../components/BatchOpsModal'

const { height } = Dimensions.get('window')

interface IProps {
  visible: boolean,
  tracks: ITrack[],
  mode: string,
  index: number,
  setMode: (mode: string) => Redux.Action,
  hide: () => Redux.Action,
  play: (index: number) => Redux.Action,
  setTracks: (tracks: ITrack[]) => Redux.Action,
  remove: (index) => Redux.Action,
  clear: () => Redux.Action,
  batchOps: (type) => any
}

class PlaylistPopup extends React.Component<IProps, any> {

  private ds = new ListView.DataSource({ rowHasChanged: (r1, r2) => r1.id !== r2.id})

  constructor (props) {
    super(props)
  }

  componentWillReceiveProps ({ index }) {
    if (index !== this.props.index) {
      this.ds = this.ds.cloneWithRows([])
    }
  }

  renderModeBtn = (iconName, text) => {
    return (
      <CustomIcon.Button
        size={20}
        name={iconName}
        color='#ccc'
        backgroundColor='white'
        onPress={this.setMode}
        underlayColor='white'
        style={styles.mode}
      >
        <Text style={{ position: 'relative', top: -1 }}>{text}</Text>
      </CustomIcon.Button>
    )
  }

  renderMode = (mode, length: number) => {
    const len = `（${length} 首）`
    return (
      mode === 'SEQUE'
        ? this.renderModeBtn('seque', '单曲播放')
        : mode === 'RANDOM'
          // tslint:disable-next-line:max-line-length
          ? this.renderModeBtn('random', '随机播放' + len)
          : this.renderModeBtn('seque1', '单曲循环' + len)
    )
  }

  setMode = () => {
    const { mode } = this.props
    const nextMode = mode === 'SEQUE'
      ? 'RANDOM'
      : mode === 'RANDOM'
        ? 'REPEAT'
        : 'SEQUE'
    this.props.setMode(nextMode)
  }

  hide = () => (this.props.hide())

  remove = (index) => () => {
    this.props.remove(index)
  }

  play = (index) => () => (this.props.play(index))

  clear = () => (this.props.clear())

  download = () => (this.props.batchOps('download'))

  collect = () => (this.props.batchOps('collect'))

  renderRow = (index) => {
    return (track: ITrack, _sectionId, rowId) => {
      const isPlaying = index === Number(rowId)
      const { name = '' } = track
      const artistName = track
        && track.artists
        && track.artists.reduce((str, acc, i) => str + (i !== 0 ? ' / ' : '') + acc.name, '')
      return (
        <TouchableHighlight
          underlayColor='white'
          onPress={isPlaying ? undefined : this.play(Number(rowId))}
        >
          <View style={[styles.row, styles.border]}>
            <BatchOps />
            <View style={{ flex: 1, justifyContent: 'center', marginLeft: 10 }}>
              <Text style={{ color: isPlaying ? Color.main : '#777' }} numberOfLines={1}>
                {name}
                <Text style={{ color: isPlaying ? Color.main : '#ccc', fontSize: 13 }}>
                  {` - ${artistName}`}
                </Text>
              </Text>
            </View>
            <View style={{ flexDirection: 'row' }}>
              {isPlaying && <View style={{ justifyContent: 'center' }}>
                <Ionic size={22} name='md-volume-up' color={Color.main} />
              </View>}
              <TouchableWithoutFeedback onPress={this.remove(Number(rowId))}>
                <View style={styles.remove}>
                  <Ionic name={'md-close'} size={22} color='#ccc' onPress={this.remove(Number(rowId))} />
                </View>
              </TouchableWithoutFeedback>
            </View>
          </View>
        </TouchableHighlight>
      )
    }
  }

  render () {
    const {
      visible,
      tracks,
      index,
      mode
    } = this.props

    this.ds = this.ds.cloneWithRows(tracks)

    return (
      <Popup
        animationType='slide-up'
        onMaskClose={this.hide}
        visible={visible}
      >
        <View style={styles.container}>
          <View style={[styles.header, styles.border]}>
            <View style={{ flex: 1, justifyContent: 'center' }}>
              {this.renderMode(mode, tracks.length)}
            </View>
            <View style={styles.action} >
              <Icon name='plus-square-o' size={20} color='#ccc' onPress={this.collect} />
            </View>
            <View style={styles.action} >
              <Icon name='download' size={20} color='#ccc' onPress={this.download} />
            </View>
            <View style={[styles.action, { marginRight: 10 }]} >
              <Icon name='trash-o' size={20} color='#ccc' onPress={this.clear} />
            </View>
          </View>
          <ListView
            style={{ flex: 1 }}
            renderRow={this.renderRow(index)}
            enableEmptySections={true}
            removeClippedSubviews={true}
            scrollRenderAheadDistance={120}
            initialListSize={15}
            showsVerticalScrollIndicator={true}
            dataSource={this.ds}
          />
          <TouchableHighlight
            style={[centering, styles.footer]}
            underlayColor='#e7e7e7'
            onPress={this.hide}
          >
            <Text style={{ fontSize: 15 }}>
              取消
            </Text>
          </TouchableHighlight>
        </View>
      </Popup>
    )
  }
}

function mapStateToProps (
  {
    player: {
      playing: {
        index
      },
      playlist,
      mode
    },
    ui: {
      popup: {
        playlist: {
          visible
        }
      }
    }
  }
) {
  return {
    index,
    visible,
    tracks: playlist || [],
    mode
  }
}

export default connect(
  mapStateToProps,
  (disptach) => ({
    setMode (mode) {
      return disptach(setModeAction(mode))
    },
    setTracks (tracks) {
      return disptach(setPlaylistTracks(tracks))
    },
    hide () {
      return disptach(hidePlaylistPopup())
    },
    play (index) {
      return disptach(playTrackAction({
        playing: {
          index
        }
      }))
    },
    clear () {
      return disptach(clearPlaylist())
    },
    remove (index) {
      return disptach(removePlaylist(index))
    },
    batchOps (type) {
      return disptach(showBatchOpsModal(type))
    }
  })
)(PlaylistPopup)

const styles = {
  container: {
    height: Math.round(height * 3 / 5)
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    height: 50
  } as ViewStyle,
  border: {
    borderBottomColor: '#ccc',
    borderBottomWidth: StyleSheet.hairlineWidth
  } as ViewStyle,
  footer: {
    borderTopColor: '#ccc',
    borderTopWidth: StyleSheet.hairlineWidth,
    height: 50,
    backgroundColor: 'white'
  } as ViewStyle,
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    height: 45
  } as ViewStyle,
  mode: {
    position: 'relative',
    top: 1
  } as ViewStyle,
  action: {
    marginHorizontal: 15,
    justifyContent: 'center',
    alignContent: 'center'
  } as TextStyle,
  remove: {
    justifyContent: 'center',
    paddingRight: 10,
    paddingLeft: 20
  } as TextStyle
}
