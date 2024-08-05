/* eslint-disable react-native/no-inline-styles */
import {View, Text} from 'react-native';
import React from 'react';
import RecorderScreen from './src/components/RecorderScreen';

const App = () => {
  return (
    <View style={{flex: 1, backgroundColor: '#fff'}}>
      <RecorderScreen />
    </View>
  );
};

export default App;
