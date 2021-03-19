import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';

import { UserData } from '../../providers/user-data';
import { ToastController } from '@ionic/angular';

import { UserOptions } from '../../interfaces/user-options';

import { HttpClient, HttpHeaders} from '@angular/common/http';
import { NativeStorage } from '@ionic-native/native-storage/ngx';
import { PopoverController } from '@ionic/angular';


@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
  styleUrls: ['./login.scss'],
})
export class LoginPage{
  login: UserOptions = { username: '', password: '' , access_token: ''};
  submitted = false;

  constructor(
    public userData: UserData,
    public router: Router,
    public httpClient: HttpClient,
    public nativeStorage: NativeStorage,
    public popoverController: PopoverController,
    public toastController: ToastController
  ) { }

  ionViewDidEnter(){
    this.nativeStorage.getItem('user')
    .then(
      data => {
        this.presentToast("Datos de inicio de sesion recordados!, Iniciando sesion...","success")
        this.sendPostRequest(data['email'],data['password'])
      },
      error => console.error("Sin datos almacenados")
    );
  }


  sendPostRequest(email?,password?) {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
        })
      };

    let postData = {
            "email": this.login.username,
            "password": this.login.password
    }
    if(!this.login.username){
      postData.email = email
      postData.password = password
    }

    this.httpClient.post("http://10.19.11.9:3003/api/auth/login", postData, httpOptions)
      .subscribe(data => {
        this.login.access_token = (data["token"]["access_token"]);
        this.userData.login(this.login.username,this.login.access_token);
        this.nativeStorage.getItem('user')
        .then(
          data => "Ya existen registros",
          error => {
            this.nativeStorage.setItem('user', {email: postData.email, password: postData.password})
            .then(
              () => console.log('Registro almacenado!'),
              error => console.error('Error storing item', error)
            );
          }
        );

        this.router.navigateByUrl('/app/tabs/schedule');
       }, error => {
        this.presentToast("Error, datos ingresados incorrectos","danger")
        console.log(error);
      });
  }
  onLogin(form: NgForm) {
    this.submitted = true;

    if (form.valid) {
      this.sendPostRequest()
    }
  }

  onSignup() {
    this.router.navigateByUrl('/signup');
  }
  async presentToast(text,valid) {
    const toast = await this.toastController.create({
      message: text,
      duration: 3000,
      position: 'middle',
      animated: true,
      color: valid

    });
    toast.present();
  }
}
