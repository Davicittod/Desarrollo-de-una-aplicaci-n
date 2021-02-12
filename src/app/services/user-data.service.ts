import { Injectable } from '@angular/core';
import { perfil } from '../tab3/tab3.page';
import { NativeStorage } from '@ionic-native/native-storage/ngx';

@Injectable({
  providedIn: 'root'
})
export class UserDataService {

  public frecuency: number;
  public usuarioActivo: perfil;

  private INSOLES_STORED: string = 'insolesConnected';

  constructor(private nativeStorage: NativeStorage) { 
    this.frecuency = 10;
  }

  public asignFactor(pesoEstimado, isLeft) {
    if(this.usuarioActivo) {
      this.nativeStorage.getItem(this.INSOLES_STORED).then( (result) => {
        let usuarios = JSON.parse(result);
        for(let user of usuarios) {
          if(user.nombre === this.usuarioActivo.nombre) {
            if(isLeft)  {
              user.leftFactor = user.peso/pesoEstimado;
            } else if (!isLeft) {
              user.rightFactor = user.peso/pesoEstimado;
            }
            this.nativeStorage.setItem(this.INSOLES_STORED, JSON.stringify(usuarios));
            console.log("Lo guardado: " + JSON.stringify(usuarios));
          }
        }
      });
    } else {
      alert("Seleccione un perfil para calibrar correctamente")
    }
  }

}

