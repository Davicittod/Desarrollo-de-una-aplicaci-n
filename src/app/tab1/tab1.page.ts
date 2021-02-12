import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';
import { NFC } from '@ionic-native/nfc/ngx';
import { HTTP } from '@ionic-native/http/ngx';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { Camera } from '@ionic-native/camera/ngx';
import { Base64 } from '@ionic-native/base64/ngx';
import { WebView } from '@ionic-native/ionic-webview/ngx';
import { Papa } from 'ngx-papaparse';
import { File } from '@ionic-native/file/ngx';



@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  providers: [ NFC, HTTP, Geolocation, Camera, Base64, WebView, File ]
})
export class Tab1Page {

  private formulario: Formula;
  private descargaHecha: boolean;
  private normativaPeso: number;
  
  public isScanning: boolean;
  public hayFoto: boolean;
  public basculas: Bascula[];
  public matriculas: string[];
  public basculaElegida: Bascula;
  public photo: Photo;

  constructor(private nfc: NFC, 
              private platform: Platform,
              private http: HTTP,
              private geolocation: Geolocation,
              private camera: Camera,
              private base64: Base64,
              private webview: WebView,
              private papa: Papa,
              private file: File) {
    this.formulario = { 
      vehiculo:'',
      bascula:'',
      accion:'',
      peso: 999,
      geolocation: {
        latitude: 999,
        longitude: 999
      }
    }
    this.descargaHecha = false;
    this.isScanning = false;
    this.basculas = [
      {
        nombre: "Báscula Entrada Gescrap", 
        expandir: true
      },
      {
        nombre: "Báscula Salida Gescrap", 
        expandir: true
      },
      {
        nombre: "Báscula Entrada Cliente", 
        expandir: true
      },
      {
        nombre: "Báscula Salida Cliente", 
        expandir: true
      },
      {
        nombre: "Punto de Recogida 1 Cliente", 
        expandir: false
      },
      {
        nombre: "Punto de Recogida 2 Cliente", 
        expandir: false
      },
      {
        nombre: "Punto de Recogida 3 Cliente", 
        expandir: false
      }
    ];
    this.basculaElegida = { nombre: '', expandir: false }
    this.hayFoto = false;
    this.photo = {
      webPath: null,
      base64: null
    }
    this.matriculas = [];
    this.normativaPeso = 990
  }

  private ngOnInit() {
    this.descarga();
    this.geolocalizacion();
  }

  //Descarga las matrículas del servidor
  private descarga() {
    if(this.descargaHecha === false) {  
      if(this.platform.is('hybrid')) {
        this.http.sendRequest('https://apiict00.etsii.upm.es/matriculas.php', { method: 'get', responseType: "json"})
        .then((response) => {
          this.descargaHecha = true;
          let respuesta = response.data;
          this.matriculas = [];
          for(var key in respuesta) {
            if(respuesta.hasOwnProperty(key)) {
              this.matriculas.push(respuesta[key]['MATRICULA'])
            }
          }
        })
        .catch( (err) => {
          alert("Ha habido un error en la descarga, inténtelo de nuevo");
          this.descargaHecha = false;
        });
      }
    }
  }

  //Guarda la ubicación del dispositivo
  private geolocalizacion() {
    this.geolocation.getCurrentPosition().then( (position) => {
      this.formulario.geolocation.latitude = position.coords.latitude
      this.formulario.geolocation.longitude = position.coords.longitude
    }, (err) => {
      alert("Ha habido un error con la ubicación");
    });
  }

  //Activa un event listener para leer tags, no para en toda la sesión de escuchar -> SOLUCIONAR
  public nfcScan(ev) {
    this.isScanning = true;
    ev.stopPropagation();
    if(this.platform.is('hybrid')) {
      this.nfc.readerMode( this.nfc.FLAG_READER_NFC_A | this.nfc.FLAG_READER_NO_PLATFORM_SOUNDS ).subscribe( (tag)=> {
        alert("¡Escaneado!");
        this.formulario.nfc = tag;
      }, err => {
        alert("Hay un error con el NFC: " + JSON.stringify(err));
      });
    }
    setTimeout(() => {
      this.isScanning = false;
      this.nfc.cancelScan();
    }, 5000);
  }

  //Cambia el valor de la báscula
  public nuevaBascula(ev) {
    this.basculaElegida.nombre = ev;
    this.formulario.bascula = ev;
    this.basculas.forEach( bascula => {
      if (bascula.nombre === ev) {
        this.basculaElegida.expandir = bascula.expandir;
        if(bascula.expandir == false)
          this.formulario.peso = 999;
      }
    });
  }

  //Toma una nueva foto, no la muestra -> SOLUCIONAR
  public nuevaFoto() {
    this.camera.getPicture({
      destinationType: 1,
      sourceType: 1,
      quality: 100
    }).then( (photo) => {
      console.log("La dirección: " + JSON.stringify(photo));
      this.photo.webPath = this.webview.convertFileSrc(photo);
      this.hayFoto = true;
      this.base64.encodeFile(photo).then((base64File: string) => {
        console.log("En base64: " + base64File);
        //this.photo.base64 = base64File;
        //this.formulario.photo = this.photo.base64;
      })
    })
  }

  //Deja de mostrar la foto actual
  public borrarFoto() {
    this.hayFoto = false;
    this.formulario.photo = null;
  }

  //Envia el formulario a la dirección deseada
  public enviarFormulario() {
    if(this.checkFormulario(this.formulario)) {
      this.http.sendRequest('https://apiict00.etsii.upm.es/envio_0.php', {method: 'post', data: this.formulario, serializer: 'json'})
        .then((response) => {
            alert("Se ha enviado correctamente: " + response.status);
        }).catch( (err) => {
          alert("Ha habido un error en el envío, inténtelo de nuevo");
        });
    }
  }

  //Comprueba que estén los parámetros básicos
  private checkFormulario( formulario: Formula ) : boolean {
    if(this.formulario.vehiculo === '') {
      alert("No ha elegido una matricula");
      return false; }
    if(this.formulario.bascula === '') {
      alert("No ha introducido una báscula");
      return false;
    } else if ((this.formulario.bascula !== '') && (this.basculaElegida.expandir) && (this.formulario.peso >= this.normativaPeso)) {
      alert("No ha introducido un peso");
      return false; 
    } else if (this.formulario.accion === '') {
      alert("No ha elegido el tipo de acción");
      return false; 
    } else if (this.formulario.geolocation.latitude === 999 || this.formulario.geolocation.longitude === 999) {
      return false;
    } 
    return true
  }

}

export interface Formula {
  nfc?: any,
  vehiculo: string,
  bascula: string,
  accion: string,
  peso: number,
  photoBase64?: string,
  photo?: any,
  geolocation: {
    latitude: number,
    longitude: number
  }  
}

export interface Bascula {
  nombre: string,
  expandir: boolean
}

export interface Photo {
  webPath: string | null ,
  base64: string | null
}
