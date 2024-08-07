/* eslint-disable react-native/no-inline-styles */
import {
  Alert,
  Dimensions,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useCallback, useState} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';

import AudioRecorderPlayer, {
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
  OutputFormatAndroidType,
} from 'react-native-audio-recorder-player';

import {permissions} from '../permissions';
import RNFS from 'react-native-fs';

import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const {width: screenWidth} = Dimensions.get('screen');
const audioRecorderPlayer = new AudioRecorderPlayer();
audioRecorderPlayer.setSubscriptionDuration(0.1);

const RecorderScreen = () => {
  const [data, setData] = useState({
    recordSecs: 0,
    recordTime: '00:00:00',
    currentPositionSec: 0,
    currentDurationSec: 0,
    playTime: '00:00:00',
    duration: '00:00:00',
  });

  const [file, setFile] = useState([]);
  const [showSendRecIcon, setShowSendRecIcon] = useState(false);
  const [isPlaying, setIsPlaying] = useState('stopped');

  let dirs = `${RNFS.DocumentDirectoryPath}`;

  let path = Platform.select({
    ios: undefined,
    android: `${dirs}/Recording_${Date.now()}.mp3`,
  });

  const onStartRecord = async () => {
    file.map(async ({path}) => {
      await RNFS.unlink(path);
    });

    setFile([]);
    permissions
      .audio_permission()
      .then(async message => {
        const audioSet = {
          AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
          AudioSourceAndroid: AudioSourceAndroidType.MIC,
          OutputFormatAndroid: OutputFormatAndroidType.AAC_ADTS,
        };
        const uri = await audioRecorderPlayer.startRecorder(path, audioSet);
        audioRecorderPlayer.addRecordBackListener(e => {
          setData({
            ...data,
            recordSecs: e.currentPosition,
            recordTime: audioRecorderPlayer.mmssss(
              Math.floor(e.currentPosition),
            ),
            currentPositionSec: 0,
            currentDurationSec: 0,
            playTime: '00:00:00',
            duration: audioRecorderPlayer.mmssss(Math.floor(e.currentPosition)),
          });
        });
        // console.log(`uri: ${uri}`);
        path = {...path, [Platform?.OS]: uri};
      })
      .catch(err => {
        Alert.alert(
          'Permission Required',
          'Please enable permissions from the app settings.',
          [
            {text: 'Cancel', style: 'cancel'},
            {
              text: 'Open Settings',
              onPress: () => Linking.openSettings(),
            },
          ],
          {cancelable: false},
        );
        console.error(err);
      });
  };

  const onStopRecord = async () => {
    await audioRecorderPlayer.stopRecorder();
    audioRecorderPlayer.removeRecordBackListener();
    setData({
      ...data,
      recordSecs: 0,
    });
    const file = await RNFS.readDir(RNFS.DocumentDirectoryPath);
    setFile(file);
  };

  const onStartPlay = useCallback(async path => {
    console.log('onStartPlay()');
    try {
      setIsPlaying('playing');
      await audioRecorderPlayer.startPlayer(path);
      await audioRecorderPlayer.setVolume(1.0);

      audioRecorderPlayer.addPlayBackListener(e => {
        setData({
          currentPositionSec: e.currentPosition,
          currentDurationSec: e.duration,
          playTime: audioRecorderPlayer.mmssss(Math.floor(e.currentPosition)),
          duration: audioRecorderPlayer.mmssss(Math.floor(e.duration)),
        });
        if (e.isFinished) {
          setIsPlaying('stopped');
        }
      });
    } catch (err) {
      console.log('startPlayer error', err);
    }
  }, []);

  const onPausePlay = async () => {
    setIsPlaying('paused');
    await audioRecorderPlayer.pausePlayer();
  };

  const onResumePlay = async () => {
    setIsPlaying('playing');
    await audioRecorderPlayer.resumePlayer();
  };

  const onStopPlay = async () => {
    audioRecorderPlayer.stopPlayer();
    audioRecorderPlayer.removePlayBackListener();
  };

  let playWidth =
    (data?.currentPositionSec / data?.currentDurationSec) * (screenWidth - 56);

  if (!playWidth) {
    playWidth = 0;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.titleTxt}>Audio Recorder Player</Text>
      <Text style={styles.txtRecordCounter}>{data?.recordTime}</Text>

      <View
        style={[
          {
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#128C7E',
            height: 45,
            width: 45,
            borderRadius: 26,
            alignSelf: 'center',
          },
        ]}>
        <TouchableOpacity
          onLongPress={() => {
            onStartRecord();
          }}
          onPressOut={() => {
            onStopRecord();
            setShowSendRecIcon(false);
          }}>
          {showSendRecIcon ? (
            <AntDesign name="close" size={20} color="white" />
          ) : (
            <FontAwesome5 name="microphone" size={20} color="white" />
          )}
        </TouchableOpacity>
      </View>

      {file.map((item, index) => (
        <TouchableOpacity
          key={index.toString()}
          onPress={() => {
            if (isPlaying === 'playing') {
              onPausePlay();
            } else if (isPlaying === 'stopped') {
              onStartPlay(item?.path);
            } else if (isPlaying === 'paused') {
              onResumePlay();
            }
          }}
          style={styles.playButton}>
          <View
            style={{
              flexDirection: 'row',
              // justifyContent: 'space-between',
              alignItems: 'center',
            }}>
            {isPlaying === 'playing' ? (
              <MaterialCommunityIcons name="pause" size={24} color="black" />
            ) : (
              <Ionicons name={'play'} size={30} color="white" />
            )}
            <Text style={styles.fileName}>{item?.name}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.fileName}>
              {data?.playTime} / {data?.duration}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </SafeAreaView>
  );
};

export default RecorderScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#455A64',
    flexDirection: 'column',
    // alignItems: 'center',
  },
  titleTxt: {
    marginTop: 100,
    color: 'white',
    fontSize: 28,
    alignSelf: 'center',
  },
  txtRecordCounter: {
    marginTop: 32,
    color: 'white',
    fontSize: 20,
    textAlignVertical: 'center',
    fontWeight: '200',
    fontFamily: 'Helvetica Neue',
    letterSpacing: 3,
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  fileName: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 20,
  },
  playButton: {
    backgroundColor: 'gray',
    borderRadius: 50,
    padding: 10,
    margin: 10,
    justifyContent: 'center',
  },
});
