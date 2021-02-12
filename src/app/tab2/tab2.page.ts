import { Component, NgZone } from '@angular/core';
import { Platform } from '@ionic/angular';
import { BLE } from '@ionic-native/ble/ngx';
import { NativeStorage } from '@ionic-native/native-storage/ngx';
import { UserDataService } from '../services/user-data.service';
import encoding from 'text-encoding';
import { perfil } from '../tab3/tab3.page';
import { Papa } from 'ngx-papaparse';
import { File } from '@ionic-native/file/ngx';

var decoder = new encoding.TextDecoder('utf-8');

let myHWRevNum = null;
let myFWRevNum = null;
let devType = null;

declare var Module;

const SetDebugMode = Module.cwrap('SetDebugMode', '', ['number']);
const InitUser = Module.cwrap('InitUser', '', ['number', 'number', 'number', 'number', 'number', 'number', 'number']);
const SetSensorSpecNew = Module.cwrap('SetSensorSpecNew', '', ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number']);


const GetCurrStress_front = Module.cwrap('GetCurrStress_front', 'number', ['number']);
const GetCurrStress_front_2 = Module.cwrap('GetCurrStress_front_2', 'number', ['number']);
const GetCurrStress_mid = Module.cwrap('GetCurrStress_mid', 'number', ['number']);
const GetCurrStress_arch = Module.cwrap('GetCurrStress_arch', 'number', ['number']);
const GetCurrStress_heel = Module.cwrap('GetCurrStress_heel', 'number', ['number']);
const GetCurrStress_heel2 = Module.cwrap('GetCurrStress_heel2', 'number', ['number']);
const GetCurrStress_hallux = Module.cwrap('GetCurrStress_hallux', 'number', ['number']);
const GetCurrStress_toes = Module.cwrap('GetCurrStress_toes', 'number', ['number']);
const GetCurrStress_total = Module.cwrap('GetCurrStress_total', 'number', ['number']);
const ProcessStride_FSR = Module.cwrap('ProcessStride_FSR', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number']);
const ProcessStride_FSR_grid = Module.cwrap('ProcessStride_FSR_grid', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number']);

const GetStress_front = Module.cwrap('GetStress_front', 'number', ['number', 'number']);
const GetStress_front_2 = Module.cwrap('GetStress_front_2', 'number', ['number', 'number']);
const GetStress_mid = Module.cwrap('GetStress_mid', 'number', ['number', 'number']);
const GetStress_arch = Module.cwrap('GetStress_arch', 'number', ['number', 'number']);
const GetStress_heel = Module.cwrap('GetStress_heel', 'number', ['number', 'number']);
const GetStress_heel2 = Module.cwrap('GetStress_heel2', 'number', ['number', 'number']);
const GetStress_hallux = Module.cwrap('GetStress_hallux', 'number', ['number', 'number']);
const GetStress_toes = Module.cwrap('GetStress_toes', 'number', ['number', 'number']);

const GetCurrStride_count = Module.cwrap('GetCurrStride_count', 'number', ['number']);


SetDebugMode(1);
//Altura,peso,altura de arco (arch height), tamaño del pie en cm,?,lleva zapatillas o no,
//int ht, int wt, int arch, int footsize, int no_of_devices, int isShod, int reportPressure
InitUser(175, 72000, 26, 28, 2, 0, 0);



@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  providers: [ BLE, NativeStorage, UserDataService, File ]
})
export class Tab2Page {

  private contador: number;
  private INSOLES_STORED: string = 'insolesConnected';
  private USERS_STORED: string = "usuariosGuardados";
  private leftCache = null;
  private rightCache = null;
  private users: perfil[];
  private CURRENT_USER: string = "usuarioActual";
  private currentUser: perfil;
  private calLeft: number[];
  private calRight: number [];
  private leftAccounted: boolean;
  private rightAccounted: boolean;
  private infoCsv: string[];
  private infoLeft: boolean;
  private infoRight: boolean;
  private auxInfo: any[];
  private guardarInfo: any[];                                                             

  public isLeftNotification: boolean;
  public isRightNotification: boolean;
  public isScanning: boolean;
  public devicesScanned: any[];
  public devicesStored: Insole[];
  public displayLeft: number;
  public displayRight: number;
  public displayLeftData: string = null;
  public displayRightData: string = null;
  public expandir: string;
  public isCalibrating: boolean;
  public numberSteps: number;


  constructor(private ble: BLE,
              private platform: Platform,
              private nativeStorage: NativeStorage,
              private ngZone: NgZone,
              public userData: UserDataService,
              private papa: Papa,
              private file: File) {
    this.isScanning = false;
    this.contador = 0;
    this.devicesScanned = [];
    this.devicesStored = [];
    this.expandir = "Ocultar";
    this.isLeftNotification = false;
    this.isRightNotification = false;
    this.calLeft = [];
    this.calRight = [];
    this.users = [];
    this.displayLeft = null;
    this.displayRight = null;
    this.numberSteps = 0;
    this.leftAccounted = false;
    this.rightAccounted = false;
    this.infoCsv = ["Pasos","Peso izquierdo","HalluxI","DedosI","Metatarso1-2I","Metatarso3-5I","ArcoI","MedioPieI","Talon1I","Talon2I",
      "Peso derecho","HalluxD","DedosD","Metatarso1-2D","Metatarso3-5D","ArcoD","MedioPieD","Talon1D","Talon2D"];
    this.infoLeft = false;
    this.infoRight = false;
    this.auxInfo = [];
    this.guardarInfo = [];
    this.isCalibrating = false;
  }

  //Descarga las configuraciones de plantillas guardadas
  private ngOnInit() {
    this.nativeStorage.getItem(this.INSOLES_STORED).then( (result) => {
      this.devicesStored = JSON.parse(result) || [];
      for(let device of this.devicesStored) {
        device.isConnected = false;
      }
    });
    this.nativeStorage.getItem(this.CURRENT_USER).then( (result)=> {
      this.currentUser = JSON.parse(result);
    });
  }

  private ionViewWillEnter() {
    this.nativeStorage.getItem(this.USERS_STORED).then( (result) => {
      this.users= JSON.parse(result);
    });
    this.nativeStorage.getItem(this.CURRENT_USER).then( (user)=> {
      this.currentUser = JSON.parse(user);
    });
  }


  public mostrarDispositivos(ev) {
    ev.stopPropagation();
    if(this.expandir === "Mostrar") {
      this.expandir = "Ocultar";
    }
    else {
      this.expandir = "Mostrar"
    }
  }

  //Escanea en busca de plantillas disponibles
  public scan(ev) {
    if(!this.isScanning) {
      this.isScanning = true;
      ev.stopPropagation();
      this.contador = this.contador + 1;
      if(this.contador > 5) {
        this.devicesScanned = [];
        this.contador = 0;
      }
      this.ble.startScanWithOptions(['1814'], { reportDuplicates: true }).subscribe((device) => {
        if(device.name.includes("Strid")) {
          if(!this.isIncluded(device.id, this.devicesScanned)) {
            this.devicesScanned.push(device);
          }
        }
      });
      setTimeout( ()=> {
        this.ble.stopScan();
        this.isScanning = false;
      }, 5000);  
    }   
  }

  //Comprueba si se ha guardado el dispositivo encontrado al escanear o al conectar
  private isIncluded(id, array) {
    if( array.length > 0 ) {
      for(let device of array ) {
        if(device.id === id) {
          return true;
        }
      }
    }
    return false;
  }

  //Comprueba si es plantilla izquierda o derecha
  public isLeft(device) {
    let data = new Uint8Array(device.advertising);
    if(data[11] === 76) {
      return true;
    } else {
      return false;
    }
  }

  //Guarda el dispositivo y su configuración para poder conectarse a él más fácilmente después
  public pairDevice(device, index) {
    if(!this.isIncluded(device.id, this.devicesStored)) {
      let insole: Insole = {
        name: device.name,
        id: device.id,
        advertising: new Uint8Array(device.advertising),
        isConnected: false,
        isLeft: this.isLeft(device)
      };
      this.devicesStored.push(insole);
      this.devicesScanned.splice(index,1);
      this.nativeStorage.setItem(this.INSOLES_STORED, JSON.stringify(this.devicesStored));
    }
  }

  //Se conecta al dispositivo y muestra si está conectado o no
  public connect(device, index) {
    this.ble.connect(device.id).subscribe( (dispositivo) => {
      this.ngZone.run( () => {
        this.devicesStored[index].isConnected = true;
      })
      if(device.isLeft) {
        this.leftCache = dispositivo;
        this.getPrimaryService(1, this.leftCache);
      } else if (!device.isLeft) {
        this.rightCache = dispositivo;
        this.getPrimaryService(0, this.rightCache);
      }
    }, (dispositivo) => {
      this.ngZone.run( () => {  
        this.devicesStored[index].isConnected = false;
      });
      if(device.isLeft) {
        this.leftCache = null;
      } else {
        this.rightCache = null;
      }
    })
  }

  public disconnect(device, index) {
    if(device.isLeft) {
      this.ble.disconnect(device.id).then( () => {
        this.ngZone.run( () => {
          this.devicesStored[index].isConnected = false;
        })
        this.leftCache = null;
      });
    } else {
      this.ble.disconnect(device.id).then( () => {
        this.ngZone.run( () => {
          this.devicesStored[index].isConnected = false;
        })
        this.rightCache = null;
      })
    }
  }

  public borrarPlantilla(device, index) {
    let alerta = false;
    if(this.leftCache) {
      if(device.id === this.leftCache.id) {
        alert("Desconecte el dispositivo para poder eliminarlo");
        alerta = true;
      }
    }
    if(this.rightCache) {
      if(device.id === this.rightCache) {
        alert("Desconecte el dispositivo para poder eliminarlo");  
        alerta = true;
      }
    }
    if(!alerta) {
      this.ngZone.run(()=> {
        this.devicesStored.splice(index,1);
        this.nativeStorage.setItem(this.INSOLES_STORED, JSON.stringify(this.devicesStored));
      })
    }
  }
  
  private getPrimaryService(isLeft, peripheral) {
    // let decoder = new TextDecoder('utf-8');
    this.ble.read(peripheral.id, "180A", "2A27")
      .then((value) =>
        myHWRevNum = decoder.decode(value)
      ).then((devHWRev) => this.configureDevice(devHWRev)
      )
    //console.log(myHWRevNum)
    this.ble.read(peripheral.id, "180A", "2A26").then((value) => {
      //console.log("myFWRevNum = " + decoder.decode(value));
      });
  }

  //Activa el envio de notificaciones de los  conectados
  public activarNotificaciones() {
    this.numberSteps = 0;
    this.guardarInfo = [];
    this.auxInfo = [];
    if(this.currentUser.leftFactor) {
      if(this.leftCache) {
        this.ngZone.run( ()=>{
          this.isLeftNotification = true;
        });
        this.ble.startNotification(this.leftCache.id, '1814', '2A53').subscribe( (data) => {
          this.showData(1, data);
        });
      } 
    } else alert("Calibre la plantilla izquierda para que pueda notificar");
    if(this.currentUser.rightFactor) { 
      if (this.rightCache) {
        this.ngZone.run( ()=>{
          this.isRightNotification = true;
        });
        this.ble.startNotification(this.rightCache.id, '1814', '2A53').subscribe( (data) => {
          this.showData(0, data);
        });
      }
    } else alert("Calibre la plantilla derecha para que pueda notificar");
  }

  public desactivarNotificaciones() {
    if(this.leftCache) {
      this.ble.stopNotification(this.leftCache.id, '1814', '2A53').then( () => {
        this.ngZone.run( ()=>{
          this.isLeftNotification = false;
        });
      });
    } 
    if (this.rightCache) {
      this.ble.stopNotification(this.rightCache.id, '1814', '2A53').then( () => {
        this.ngZone.run( ()=>{
          this.isRightNotification = false;
          this.isLeftNotification = false;
        });
      });
    }
    let date = new Date();
    let csv = this.papa.unparse({
      fields: this.infoCsv,
      data: this.guardarInfo
    });
    let text = JSON.stringify(date).slice(1,-9).replace(":","").replace(/-/g,'').replace('T','_');
    if(this.platform.is('cordova')) {
      this.file.writeFile(this.file.externalApplicationStorageDirectory, 
        this.currentUser.nombre + '_' + text + '.csv', csv, {replace: true}). then( (res) => {
        console.log("Guardado: " + JSON.stringify(res));
      });
    }
  }

  private showData(isLeft, buffer: ArrayBuffer) {
    var data = new Uint8Array(buffer[0]);
    //console.log(data);
    var nDataBytes = data.length * data.BYTES_PER_ELEMENT;
    var dataPtr = Module._malloc(nDataBytes);
    var dataHeap = new Uint8Array(Module.HEAPU8.buffer, dataPtr, nDataBytes);
    dataHeap.set(new Uint8Array(data.buffer));
    
    var result;
    if (devType == "discrete") {
      ///            processAccelGyro (dataHeap, data, isLeft);
      result = ProcessStride_FSR(dataHeap.byteOffset, data.length, 0, 0, 0, isLeft, 0, 0, 1, 1);

    } else if (devType == "grid") {
      result = ProcessStride_FSR_grid(dataHeap.byteOffset, data.length, 0, 0, 0, isLeft, 0, 0, 1, 1);
    }
    
    this.ngZone.run(() => {
      if(result) {
        if(isLeft){
          //console.log("Pasos izquierdo: " + GetCurrStride_count(1));
          //this.mL.push(parseFloat(GetCurrStress_total(1).toFixed(2)));
          /*if(this.mL.length > this.frecMuestra) {
            let sum = this.mL.reduce( (previous,current) => current += previous);
            let avg = sum/this.mL.length;
            console.log("La izquierda: " + avg);
            this.meanLeft.push(avg);
            this.mL = [];
          }*/
          if(this.displayLeft < 20) {
            let value = parseFloat(GetCurrStress_total(1))*this.currentUser.leftFactor;
            if(value < 20) {
              if(!this.leftAccounted) {
                this.numberSteps = this.numberSteps + 1;
                this.leftAccounted = true;
                console.log("Sumado del izquierdo");
              }
            } else this.leftAccounted = false;
          } 
          this.displayLeft = parseFloat(GetCurrStress_total(1).toFixed(2))*this.currentUser.leftFactor*1.05;
          this.displayLeftData = this.displayLeft.valueOf().toFixed(2);
          this.auxInfo[1]= this.displayLeft;
          this.auxInfo[2] = parseFloat(GetCurrStress_hallux(1).toFixed(2))*this.currentUser.leftFactor*1.05;
          this.auxInfo[3] = parseFloat(GetCurrStress_toes(1).toFixed(2))*this.currentUser.leftFactor*1.05;
          this.auxInfo[4] = parseFloat(GetCurrStress_front(1).toFixed(2))*this.currentUser.leftFactor*1.05;
          this.auxInfo[5] = parseFloat(GetCurrStress_front_2(1).toFixed(2))*this.currentUser.leftFactor*1.05;
          this.auxInfo[6] = parseFloat(GetCurrStress_arch(1).toFixed(2))*this.currentUser.leftFactor*1.05;
          this.auxInfo[7] = parseFloat(GetCurrStress_mid(1).toFixed(2))*this.currentUser.leftFactor*1.05;
          this.auxInfo[8] = parseFloat(GetCurrStress_heel(1).toFixed(2))*this.currentUser.leftFactor*1.05;
          this.auxInfo[9] = parseFloat(GetCurrStress_heel2(1).toFixed(2))*this.currentUser.leftFactor*1.05;
          this.infoLeft = true;
        }
        else if (!isLeft) {
          //console.log("Pasos derecho: " + GetCurrStride_count(0));
          //this.mR.push(parseFloat(GetCurrStress_total(0).toFixed(2)));
          /*if(this.mR.length > this.frecMuestra) {
            let sum = this.mR.reduce( (previous,current) => current += previous);
            let avg = sum/this.mR.length;
            console.log("La  derecha: " + avg);
            this.meanRight.push(avg);
            this.mR = [];
          }*/
          if(this.displayRight < 20) {
            let value = parseFloat(GetCurrStress_total(0))*this.currentUser.rightFactor
            if(value < 20) {
              if(!this.rightAccounted) {
                this.numberSteps = this.numberSteps + 1;
                this.rightAccounted = true;
                console.log("Sumado del derecho");
              }
            } else this.rightAccounted = false;
          } 
          this.displayRight = parseFloat(GetCurrStress_total(0))*this.currentUser.rightFactor*1.05;
          this.displayRightData = this.displayRight.valueOf().toFixed(2);
          this.auxInfo[10] = this.displayRight;
          this.auxInfo[11] = parseFloat(GetCurrStress_hallux(0).toFixed(2))*this.currentUser.rightFactor*1.05;
          this.auxInfo[12] = parseFloat(GetCurrStress_toes(0).toFixed(2))*this.currentUser.rightFactor*1.05;
          this.auxInfo[13] = parseFloat(GetCurrStress_front(0).toFixed(2))*this.currentUser.rightFactor*1.05;
          this.auxInfo[14] = parseFloat(GetCurrStress_front_2(0).toFixed(2))*this.currentUser.rightFactor*1.05;
          this.auxInfo[15] = parseFloat(GetCurrStress_arch(0).toFixed(2))*this.currentUser.rightFactor*1.05;
          this.auxInfo[16] = parseFloat(GetCurrStress_mid(0).toFixed(2))*this.currentUser.rightFactor*1.05;
          this.auxInfo[17] = parseFloat(GetCurrStress_heel(0).toFixed(2))*this.currentUser.rightFactor*1.05;
          this.auxInfo[18] = parseFloat(GetCurrStress_heel2(0).toFixed(2))*this.currentUser.rightFactor*1.05;
          this.infoRight = true;
        }
        if(this.infoLeft && this.infoRight) {
          this.auxInfo[0] = this.numberSteps;
          this.guardarInfo.push(this.auxInfo);
          this.auxInfo = [];
          this.infoLeft = false;
          this.infoRight = false;
        }
      }
    });
    Module._free(dataHeap.byteOffset);
  }

  public calibrar() {
    if(this.currentUser) {
      alert("Camine alternando de pie muy lentamente. \nPulse aceptar para empezar.");
      this.isCalibrating = true;
      if(this.leftCache) {
        this.calLeft = [];
        this.ble.startNotification(this.leftCache.id, '1814', '2A53').subscribe( (buffer) => {
          var data = new Uint8Array(buffer[0]);
          //console.log(data);
          var nDataBytes = data.length * data.BYTES_PER_ELEMENT;
          var dataPtr = Module._malloc(nDataBytes);
          var dataHeap = new Uint8Array(Module.HEAPU8.buffer, dataPtr, nDataBytes);
          dataHeap.set(new Uint8Array(data.buffer));
          
          var result;
          if (devType == "discrete") {
            ///            processAccelGyro (dataHeap, data, isLeft);
            result = ProcessStride_FSR(dataHeap.byteOffset, data.length, 0, 0, 0, 1, 0, 0, 1, 1);

          } else if (devType == "grid") {
            result = ProcessStride_FSR_grid(dataHeap.byteOffset, data.length, 0, 0, 0, 1, 0, 0, 1, 1);
          }
          this.calLeft.push(parseFloat(GetCurrStress_total(1).toFixed(2)));

        });
      } 
      if (this.rightCache) {
        this.calRight = [];
        this.ble.startNotification(this.rightCache.id, '1814', '2A53').subscribe( (buffer) => {
          var data = new Uint8Array(buffer[0]);
          //console.log(data);
          var nDataBytes = data.length * data.BYTES_PER_ELEMENT;
          var dataPtr = Module._malloc(nDataBytes);
          var dataHeap = new Uint8Array(Module.HEAPU8.buffer, dataPtr, nDataBytes);
          dataHeap.set(new Uint8Array(data.buffer));
          
          var result;
          if (devType == "discrete") {
            ///            processAccelGyro (dataHeap, data, isLeft);
            result = ProcessStride_FSR(dataHeap.byteOffset, data.length, 0, 0, 0, 0, 0, 0, 1, 1);

          } else if (devType == "grid") {
            result = ProcessStride_FSR_grid(dataHeap.byteOffset, data.length, 0, 0, 0, 0, 0, 0, 1, 1);
          }
          this.calRight.push(parseFloat(GetCurrStress_total(0).toFixed(2)));
        });
      }
      //ProcessStride_FSR_grid(dataHeap.byteOffset, data.length, 0, 0, 0, isLeft, 0, 0, 1, 1);
      setTimeout(() => {
        if(this.leftCache) {
          this.ble.stopNotification(this.leftCache.id, '1814', '2A53');
          let topFiveLeft = this.calLeft.sort(function(a, b){return b - a}).slice(0, 5);
          let sumLeft = topFiveLeft.reduce((previous, current) => current += previous);
          let avgLeft = sumLeft / topFiveLeft.length;
          console.log('topFiveLeft', topFiveLeft, "mean: " + avgLeft);
          this.asignFactor(avgLeft, 1);
          this.isCalibrating = false;
        }
        if(this.rightCache) {
          this.ble.stopNotification(this.rightCache.id, '1814', '2A53');
          let topFiveRight = this.calRight.sort(function(a, b){return b - a}).slice(0, 5);
          let sumRight = topFiveRight.reduce((previous, current) => current += previous);
          let avgRight = sumRight / topFiveRight.length;
          console.log('topFiveRight', topFiveRight, "mean: " + avgRight);
          this.asignFactor(avgRight, 0);
          this.isCalibrating = false;
        }
        alert("Calibración realizada.");
      }, 15000);
    } else {
      alert("Seleccione un perfil para calibrar correctamente");
    }
  }

  private asignFactor(pesoEstimado, isLeft) {
    for(let user of this.users) {
      if(user.nombre === this.currentUser.nombre) {
        if(isLeft)  {
          user.leftFactor = user.peso/pesoEstimado;
          this.currentUser.leftFactor = user.leftFactor;
        } else if (!isLeft) {
          user.rightFactor = user.peso/pesoEstimado;
          this.currentUser.rightFactor = user.rightFactor;
        }
        this.nativeStorage.setItem(this.USERS_STORED, JSON.stringify(this.users));
        this.nativeStorage.setItem(this.CURRENT_USER, JSON.stringify(this.currentUser));
        console.log("Usuarios guardados: " + JSON.stringify(this.users));
      }
    };
  }


  private configureDevice(hwRevNum) {
    console.log("Configuración: " + hwRevNum);
    if (hwRevNum === null) {
      return;
    }
    switch (hwRevNum) {
      case "STRD_PPP_01":
        SetSensorSpecNew(0, 0, 0, 0, 0, 0, 0, 0, 3, 24, 1);
        devType = "bbgrid";
        break;

      case "STRD_PRS_01_285":
        SetSensorSpecNew(0, 0, 0, 0, 0, 0, 0, 0, 3, 20, 1);
        SetSensorSpecNew(0, 0, 0, 0, 0, 0, 0, 0, 3, 20, 0);
        devType = "grid";
        break;

      case "STRD_PRS_01_27":
      case "STRD_PRS_02_27":

        SetSensorSpecNew(0, 0, 0, 0, 0, 0, 0, 0, 3, 22, 1);
        SetSensorSpecNew(0, 0, 0, 0, 0, 0, 0, 0, 3, 22, 0);
        devType = "grid";
        break;


      case "STRD_PRS_01_24":
      case "STRD_PRS_02_24":
        SetSensorSpecNew(0, 0, 0, 0, 0, 0, 0, 0, 3, 23, 1);
        SetSensorSpecNew(0, 0, 0, 0, 0, 0, 0, 0, 3, 23, 0);
        devType = "grid";
        break;

      case "STRD_INSAE_05":
        SetSensorSpecNew(10, 8, 6, 7, 4, 5, 11, 9, 2, 5, 1);
        SetSensorSpecNew(10, 8, 6, 7, 4, 5, 11, 9, 2, 5, 0);
        devType = "discrete";
        break;

      case "STRD_INSAE_04":
        SetSensorSpecNew(9, 5, 10, 7, 4, 8, 6, 11, 2, 5, 1);
        SetSensorSpecNew(9, 8, 7, 10, 4, 5, 6, 11, 2, 5, 0);
        devType = "discrete";
        break;

      case "STRD_PRFI_02":
      case "STRD_INSI_02":

        SetSensorSpecNew(7, 9, 8, 0, 4, 0, 6, 5, 2, 6, 1);
        SetSensorSpecNew(7, 9, 8, 0, 4, 0, 6, 5, 2, 6, 0);
        devType = "discrete";
        break;

      case "STRD_PRFI_01":
        SetSensorSpecNew(7, 9, 8, 8, 4, 8, 6, 5, 2, 6, 1);
        SetSensorSpecNew(7, 9, 8, 8, 4, 8, 6, 5, 2, 6, 0);
        devType = "discrete";
        break;
      case "STRD_INS3_02":
        SetSensorSpecNew(5, 9, 6, 7, 4, 0, 8, 0, 2, 3, 1);
        SetSensorSpecNew(8, 4, 7, 6, 9, 0, 5, 0, 2, 3, 0);
        devType = "discrete";
        break;

      default:
        break;
    }
  }

  //Testing
  alertState() {
    console.log("Derecho", this.rightCache);
    this.ble.read(this.rightCache.id, '180F','2A19').then((result)=> {
      console.log(result);
    });
  }
}

export interface Insole {
  name: string,
  id: string,
  advertising: Uint8Array,
  isConnected: boolean,
  isLeft: boolean
}
