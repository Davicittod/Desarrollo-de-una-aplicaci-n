/*
Instalaciones:

npm install @ionic-native/core

ionic cordova plugin add cordova-plugin-geolocation
npm install @ionic-native/geolocation

ionic cordova plugin add phonegap-nfc
npm install @ionic-native/nfc

ionic cordova plugin add cordova-plugin-ble-central
npm install @ionic-native/ble

ionic cordova plugin add cordova-plugin-advanced-http
npm install @ionic-native/http

ionic cordova plugin add cordova-plugin-camera
npm install @ionic-native/camera

ionic cordova plugin add com-badrit-base64
npm install @ionic-native/base64

ionic cordova plugin add cordova-plugin-nativestorage
npm install @ionic-native/native-storage

ionic cordova plugin add cordova.plugins.diagnostic
npm install --save @ionic-native/diagnostic@4

npm i text-encoding

ionic cordova plugin add cordova-plugin-ionic-webview
npm install @ionic-native/ionic-webview

npm install ngx-papaparse@5 --save

ionic cordova plugin add cordova-plugin-file
npm install @ionic-native/file
*/

import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));
