import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { NativeStorage } from '@ionic-native/native-storage/ngx';
import { ToastController } from '@ionic/angular';


@Injectable({
  providedIn: 'root'
})
export class UserData {
  favorites: string[] = [];
  HAS_LOGGED_IN = 'hasLoggedIn';
  HAS_SEEN_TUTORIAL = 'hasSeenTutorial';

  constructor(
    public storage: Storage,
    public nativeStorage: NativeStorage,
    public toastController: ToastController
  ) { }

  hasFavorite(sessionName: string): boolean {
    return (this.favorites.indexOf(sessionName) > -1);
  }

  addFavorite(sessionName: string): void {
    this.favorites.push(sessionName);
  }

  removeFavorite(sessionName: string): void {
    const index = this.favorites.indexOf(sessionName);
    if (index > -1) {
      this.favorites.splice(index, 1);
    }
  }

  login(username: string,access_token: string): Promise<any> {
    return this.storage.set(this.HAS_LOGGED_IN, true).then(() => {
      this.setUsername(username);
      this.setAccessToken(access_token)
      return window.dispatchEvent(new CustomEvent('user:login'));
    });
  }

  signup(username: string): Promise<any> {
    return this.storage.set(this.HAS_LOGGED_IN, true).then(() => {
      this.setUsername(username);
      return window.dispatchEvent(new CustomEvent('user:signup'));
    });
  }

  logout(): Promise<any> {
    this.nativeStorage.clear();
    this.presentToast("Datos de inicio de sesion eliminados!, Cerrando sesion...","danger")
    return this.storage.remove(this.HAS_LOGGED_IN).then(() => {
      return this.storage.remove('username');
    }).then(() => {
      window.dispatchEvent(new CustomEvent('user:logout'));
    });
  }

  setUsername(username: string): Promise<any> {
    return this.storage.set('username', username);
  }

  getUsername(): Promise<string> {
    return this.storage.get('username').then((value) => {
      return value;
    });
  }

  setAccessToken(access_token: string): Promise<any> {
    return this.storage.set('access_token', access_token);
  }

  getAccessToken(): Promise<string> {
    return this.storage.get('access_token').then((value) => {
      return value;
    });
  }

  isLoggedIn(): Promise<boolean> {
    return this.storage.get(this.HAS_LOGGED_IN).then((value) => {
      return value === true;
    });
  }

  checkHasSeenTutorial(): Promise<string> {
    return this.storage.get(this.HAS_SEEN_TUTORIAL).then((value) => {
      return value;
    });
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
