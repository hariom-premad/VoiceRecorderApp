import {PermissionsAndroid, Platform} from 'react-native';

class Permissions {
  audio_permission = () =>
    new Promise((resolve, reject) => {
      if (Platform.OS === 'android') {
        PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ])
          .then(grants => {
            console.log(
              'write external storage',
              grants['android.permission.RECORD_AUDIO'],
              PermissionsAndroid.RESULTS.GRANTED,
            );

            if (
              // grants['android.permission.WRITE_EXTERNAL_STORAGE'] ===
              //   PermissionsAndroid.RESULTS.GRANTED &&
              // grants['android.permission.READ_EXTERNAL_STORAGE'] ===
              //   PermissionsAndroid.RESULTS.GRANTED &&
              grants['android.permission.RECORD_AUDIO'] ===
              PermissionsAndroid.RESULTS.GRANTED
            ) {
              console.log('Permissions granted');
              return resolve('Permissions granted');
            } else {
              console.log('All required permissions not granted');
              return reject('All required permissions not granted');
            }
          })
          .catch(err => {
            console.warn(err);
            return reject('Something went wrong!');
          });
      }
    });
}

export const permissions = new Permissions();
