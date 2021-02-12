import { Component } from '@angular/core';
import { NativeStorage } from '@ionic-native/native-storage/ngx';
import { UserDataService } from '../services/user-data.service';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  providers: [ NativeStorage, UserDataService ]
})
export class Tab3Page {

  private actualUser: perfil;
  private USERS_STORED: string = "usuariosGuardados";
  private CURRENT_USER: string = "usuarioActual";
  private users: perfil[];
  private newUser: perfil;

  
  public frecuencia: number;
  public isNewUser: boolean;

  constructor(public userData: UserDataService,
              private nativeStorage: NativeStorage ) {
    this.frecuencia = 10;
    this.newUser = {
      nombre: '',
      peso: 999,
      leftFactor: null,
      rightFactor: null
    };
    this.users = [];
    this.actualUser = {
      nombre: '',
      peso: 74,
      leftFactor: null,
      rightFactor: null
    }
  }

  private ngOnInit() {
    console.log("Se descargan");
    this.nativeStorage.getItem(this.USERS_STORED).then( (result) => {
      console.log("usuarios guardados: " + result);
      this.users = JSON.parse(result) || [];
    });
    this.nativeStorage.getItem(this.CURRENT_USER).then( (result)=> {
      console.log("el último usuario: " + result);
        this.actualUser = JSON.parse(result);
        this.userData.usuarioActivo = this.actualUser;
    });
  }

  public nuevoUsuario() {
    this.isNewUser = true;
  }

  public cancelarNuevoUsuario() {
    this.isNewUser = false;
    this.newUser = {
      nombre: '',
      peso: 999,
      leftFactor: null,
      rightFactor: null
    };
  }

  public guardarNuevoUsuario() {
    if(!this.isIncluded(this.newUser, this.users)) {
      let usuario: perfil = {
        nombre: this.newUser.nombre,
        peso: this.newUser.peso,
        leftFactor: null,
        rightFactor: null
      }
      this.users.push(usuario);
      console.log("Los nuevos usuarios: " + JSON.stringify(this.users));
      this.nativeStorage.setItem(this.USERS_STORED, JSON.stringify(this.users));
      this.isNewUser = false;
      this.actualUser = usuario;
      this.nativeStorage.setItem(this.CURRENT_USER, JSON.stringify(usuario));
      alert("Usuario guardado");
    }
  }

  

  private isIncluded(user, array) {
    if(user.nombre === '') {
      alert("Introduzca un nombre válido");
      return true;  
    } else if (user.peso > 300) {
      alert("Introduzca un peso de usuario válido");
      return true;
    } else if(array.length > 0) {
      for(let usuario of array ) {
        if(usuario.nombre === user.nombre) {
          console.log(user.nombre + user.nombre);
          alert("El nombre de usuario ya está seleccionado");
          return true;
        } 
      }
    }
    return false;
  }

  public usuarioActual(ev) {
    console.log(ev);
    for(let user of this.users) {
      if(user.nombre === ev) {
        this.actualUser = user;
        this.nativeStorage.setItem(this.CURRENT_USER, JSON.stringify(this.actualUser)).then(()=> {
          console.log("Guardado: " + JSON.stringify(this.actualUser));
        });
      }
    }
  }

  public cambiarValor() {
    console.log("En este lado: " + this.frecuencia);
    this.userData.frecuency = this.frecuencia;
  }

  public mostrarNuevoUsuario() {
    console.log("Los usuarios: " + JSON.stringify(this.users));
    console.log("El perfil actual: " + JSON.stringify(this.userData.usuarioActivo));
  }

}

export interface perfil {
  nombre: string,
  peso: number
  leftFactor: number | null,
  rightFactor: number | null
}
