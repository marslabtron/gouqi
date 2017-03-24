import {
  View,
  Image,
  Text,
  TextStyle,
  ViewStyle,
  Dimensions,
  TouchableWithoutFeedback
 } from 'react-native'

import * as React from 'react'

const { width } = Dimensions.get('window')

const Item = ({item, index, onPress}) => {
  const isMiddle = (index + 1) % 3 === 2
  const uri = (item.coverImgUrl || item.picUrl) + '?param=300y300'
  return (
    <TouchableWithoutFeedback
      // tslint:disable-next-line:jsx-no-lambda
      onPress={() => onPress(item)}
    >
      <View
        style={[styles.item, isMiddle && { marginHorizontal: 5 }]}
      >
        <Image
          style={styles.image}
          source={{uri}}
        />
        {item.meta && <Text style={styles.meta}>{item.meta}</Text>}
        <Text style={styles.title} numberOfLines={item.subtitle ? 1 : 2}>{item.name}</Text>
        {item.subtitle && <Text style={styles.subtitle} numberOfLines={1}>{item.subtitle}</Text>}
      </View>
    </TouchableWithoutFeedback>
  )
}

const Grid = ({data, onPress}) => {
  return (
    <View style={styles.container}>
      {data.map((item, index) => <Item item={item} index={index} onPress={onPress} key={item.id}/>)}
    </View>
  )
}

const gridWidth = ( width - 10 ) / 3

const styles = {
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start'
  } as ViewStyle,
  item: {
    width: gridWidth,
    marginBottom: 15
  } as ViewStyle,
  image: {
    width: gridWidth,
    height: gridWidth
  },
  meta: {
    position: 'absolute',
    top: gridWidth - 20,
    color: 'white',
    backgroundColor: 'transparent',
    left: 5,
    fontSize: 13
  } as TextStyle,
  title: {
    marginLeft: 5,
    marginTop: 5
  } as TextStyle,
  subtitle: {
    marginLeft: 5,
    marginTop: 5,
    fontSize: 13,
    color: '#ccc'
  } as TextStyle
}

export default Grid
