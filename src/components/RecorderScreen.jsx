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
import Button from './uis/Button';
import AudioRecorderPlayer, {
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
  OutputFormatAndroidType,
} from 'react-native-audio-recorder-player';
import {permissions} from '../permissions';
import RNFS from 'react-native-fs';

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

  let dirs =
    // RNFetchBlob.fs.dirs;
    `${RNFS.DocumentDirectoryPath}`;

  let path = Platform.select({
    ios: undefined,
    android: `${dirs}/recording.mp3`,
  });

  const onStatusPress = e => {
    const touchX = e.nativeEvent.locationX;
    console.log(`touchX: ${touchX}`);

    const playWidth =
      (data?.currentPositionSec / data?.currentDurationSec) *
      (screenWidth - 56);
    console.log(`currentPlayWidth: ${playWidth}`);

    const currentPosition = Math.round(data?.currentPositionSec);

    if (playWidth && playWidth < touchX) {
      const addSecs = Math.round(currentPosition + 1000);
      audioRecorderPlayer.seekToPlayer(addSecs);
      console.log(`addSecs: ${addSecs}`);
    } else {
      const subSecs = Math.round(currentPosition - 1000);
      audioRecorderPlayer.seekToPlayer(subSecs);
      console.log(`subSecs: ${subSecs}`);
    }
  };

  const onStartRecord = async () => {
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
          // console.log('record-back', e);
          setData({
            ...data,
            recordSecs: e.currentPosition,
            recordTime: audioRecorderPlayer.mmssss(
              Math.floor(e.currentPosition),
            ),
          });
        });
        // console.log(`uri: ${uri}`);
        path = {...path, [Platform?.OS]: uri};
        console.log('path', path);
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

  const onPauseRecord = async () => {
    try {
      const r = await audioRecorderPlayer.pauseRecorder();
      console.log(r);
    } catch (err) {
      console.log('pauseRecord', err);
    }
  };

  const onResumeRecord = async () => {
    await audioRecorderPlayer.resumeRecorder();
  };

  const onStopRecord = async () => {
    const result = await audioRecorderPlayer.stopRecorder();
    audioRecorderPlayer.removeRecordBackListener();
    setData({
      ...data,
      recordSecs: 0,
    });
    console.log(result);
  };

  const onStartPlay = useCallback(async () => {
    console.log('onStartPlay', path);

    try {
      const msg = await audioRecorderPlayer.startPlayer(path[Platform?.OS]);
      const volume = await audioRecorderPlayer.setVolume(1.0);
      console.log(`path: ${msg}`, `volume: ${volume}`);

      audioRecorderPlayer.addPlayBackListener(e => {
        console.log('playBackListener', e);
        setData({
          currentPositionSec: e.currentPosition,
          currentDurationSec: e.duration,
          playTime: audioRecorderPlayer.mmssss(Math.floor(e.currentPosition)),
          duration: audioRecorderPlayer.mmssss(Math.floor(e.duration)),
        });
      });
    } catch (err) {
      console.log('startPlayer error', err);
    }
  }, [path]);

  const onPausePlay = async () => {
    await audioRecorderPlayer.pausePlayer();
  };

  const onResumePlay = async () => {
    await audioRecorderPlayer.resumePlayer();
  };

  const onStopPlay = async () => {
    console.log('onStopPlay');
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
      <View style={styles.viewRecorder}>
        <View style={styles.recordBtnWrapper}>
          <Button
            style={styles.btn}
            onPress={onStartRecord}
            textStyle={styles.txt}>
            Record
          </Button>
          <Button
            style={[
              styles.btn,
              {
                marginLeft: 12,
              },
            ]}
            onPress={onPauseRecord}
            textStyle={styles.txt}>
            Pause
          </Button>
          <Button
            style={[
              styles.btn,
              {
                marginLeft: 12,
              },
            ]}
            onPress={onResumeRecord}
            textStyle={styles.txt}>
            Resume
          </Button>
          <Button
            style={[styles.btn, {marginLeft: 12}]}
            onPress={onStopRecord}
            textStyle={styles.txt}>
            Stop
          </Button>
        </View>
      </View>
      <View style={styles.viewPlayer}>
        <TouchableOpacity style={styles.viewBarWrapper} onPress={onStatusPress}>
          <View style={styles.viewBar}>
            <View style={[styles.viewBarPlay, {width: playWidth}]} />
          </View>
        </TouchableOpacity>
        <Text style={styles.txtCounter}>
          {data?.playTime} / {data?.duration}
        </Text>
        <View style={styles.playBtnWrapper}>
          <Button
            style={styles.btn}
            onPress={onStartPlay}
            textStyle={styles.txt}>
            Play
          </Button>
          <Button
            style={[
              styles.btn,
              {
                marginLeft: 12,
              },
            ]}
            onPress={onPausePlay}
            textStyle={styles.txt}>
            Pause
          </Button>
          <Button
            style={[
              styles.btn,
              {
                marginLeft: 12,
              },
            ]}
            onPress={onResumePlay}
            textStyle={styles.txt}>
            Resume
          </Button>
          <Button
            style={[
              styles.btn,
              {
                marginLeft: 12,
              },
            ]}
            onPress={onStopPlay}
            textStyle={styles.txt}>
            Stop
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default RecorderScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#455A64',
    flexDirection: 'column',
    alignItems: 'center',
  },
  titleTxt: {
    marginTop: 100,
    color: 'white',
    fontSize: 28,
  },
  viewRecorder: {
    marginTop: 40,
    width: '100%',
    alignItems: 'center',
  },
  recordBtnWrapper: {
    flexDirection: 'row',
  },
  viewPlayer: {
    marginTop: 60,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  viewBarWrapper: {
    marginTop: 28,
    marginHorizontal: 28,
    alignSelf: 'stretch',
  },
  viewBar: {
    backgroundColor: '#ccc',
    height: 4,
    alignSelf: 'stretch',
  },
  viewBarPlay: {
    backgroundColor: 'white',
    height: 4,
    width: 0,
  },
  playStatusTxt: {
    marginTop: 8,
    color: '#ccc',
  },
  playBtnWrapper: {
    flexDirection: 'row',
    marginTop: 40,
  },
  btn: {
    borderColor: 'white',
    borderWidth: 1,
  },
  txt: {
    color: 'white',
    fontSize: 14,
    marginHorizontal: 8,
    marginVertical: 4,
  },
  txtRecordCounter: {
    marginTop: 32,
    color: 'white',
    fontSize: 20,
    textAlignVertical: 'center',
    fontWeight: '200',
    fontFamily: 'Helvetica Neue',
    letterSpacing: 3,
  },
  txtCounter: {
    marginTop: 12,
    color: 'white',
    fontSize: 20,
    textAlignVertical: 'center',
    fontWeight: '200',
    fontFamily: 'Helvetica Neue',
    letterSpacing: 3,
  },
});
