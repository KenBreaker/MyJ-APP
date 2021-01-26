import { Component, ViewChild, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, IonList, IonRouterOutlet, LoadingController, ModalController, ToastController, Config } from '@ionic/angular';
import { HttpClient, HttpHeaders} from '@angular/common/http';
import { ScheduleFilterPage } from '../schedule-filter/schedule-filter';
import { ConferenceData } from '../../providers/conference-data';
import { UserData } from '../../providers/user-data';

@Component({
  selector: 'page-schedule',
  templateUrl: 'schedule.html',
  styleUrls: ['./schedule.scss'],
})
export class SchedulePage{
  // Gets a reference to the list element
  @ViewChild('scheduleList', { static: true }) scheduleList: IonList;
  access_token: string;
  ios: boolean;
  dayIndex = 0;
  queryText = '';
  segment = 'all';
  excludeTracks: any = [];
  shownSessions: any = [];
  groups: any = [];
  confDate: string;
  showSearchbar: boolean;
  show = false;
  constructor(
    public alertCtrl: AlertController,
    public confData: ConferenceData,
    public loadingCtrl: LoadingController,
    public modalCtrl: ModalController,
    public router: Router,
    public routerOutlet: IonRouterOutlet,
    public toastCtrl: ToastController,
    public user: UserData,
    public config: Config,
    public httpClient: HttpClient,
    public userData: UserData,
    public toastController: ToastController
  ) { }

  ionViewWillEnter() {
    this.getAccessToken()
    this.ios = this.config.get('mode') === 'ios';
  }

  ionViewDidEnter(){
    this.updateSchedule();
  }
  sendPostRequest() {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + this.access_token
        })
      };

    this.httpClient.get("http://10.19.11.9:3005/api/users/current", httpOptions)
      .subscribe(data => {
        this.presentToast("Se han actualizado las ordenes correctamente!","success");

       }, error => {
        this.presentToast("Fallo al intentar actualizar ordenes!","danger");
        console.log(error);
      });
      this.show = true
  }

  getAccessToken() {
    this.userData.getAccessToken().then((access_token) => {
      this.access_token = access_token;
      if (this.scheduleList) {
        this.scheduleList.closeSlidingItems();
      }
      this.confData.getTimeline(this.dayIndex, "", this.excludeTracks, this.segment,access_token).subscribe((data: any) => {
        this.shownSessions = data.shownSessions;
        this.groups = data.groups;

      });
      this.ios = this.config.get('mode') === 'ios';
    });
  }

  updateSchedule(access_token?) {
    // Close any open sliding items when the schedule updates
    if (this.scheduleList) {
      this.scheduleList.closeSlidingItems();
    }
    this.confData.getTimeline(this.dayIndex, this.queryText, this.excludeTracks, this.segment,access_token).subscribe((data: any) => {
      this.shownSessions = data.shownSessions;
      this.groups = data.groups;
    });
  }

  update(){
    this.getAccessToken()
  }

  async presentFilter() {
    const modal = await this.modalCtrl.create({
      component: ScheduleFilterPage,
      swipeToClose: true,
      presentingElement: this.routerOutlet.nativeEl,
      componentProps: { excludedTracks: this.excludeTracks }
    });
    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data) {
      this.excludeTracks = data;
      this.updateSchedule(this.access_token);
    }
  }

  async addFavorite(slidingItem: HTMLIonItemSlidingElement, sessionData: any) {
    if (this.user.hasFavorite(sessionData.name)) {
      // Prompt to remove favorite
      this.removeFavorite(slidingItem, sessionData, 'Orden en proceso');
    } else {
      // Add as a favorite
      this.user.addFavorite(sessionData.name);

      // Close the open item
      slidingItem.close();

      // Create a toast
      const toast = await this.toastCtrl.create({
        header: `${sessionData.name} se ha puesto en proceso.`,
        duration: 3000
      });

      // Present the toast at the bottom of the page
      await toast.present();
    }

  }

  async removeFavorite(slidingItem: HTMLIonItemSlidingElement, sessionData: any, title: string) {
    const alert = await this.alertCtrl.create({
      header: title,
      message: 'Deseas finalizar esta orden?',
      buttons: [
        {
          text: 'Cancelar',
          handler: () => {
            // they clicked the cancel button, do not remove the session
            // close the sliding item and hide the option buttons
            slidingItem.close();
          }
        },
        {
          text: 'Finalizar',
          handler: () => {
            // they want to remove this session from their favorites
            this.user.removeFavorite(sessionData.name);
            this.updateSchedule();

            // close the sliding item and hide the option buttons
            slidingItem.close();
          }
        }
      ]
    });
    // now present the alert on top of all other content
    await alert.present();
  }

  async openSocial(network: string, fab: HTMLIonFabElement) {
    const loading = await this.loadingCtrl.create({
      message: `Posting to ${network}`,
      duration: (Math.random() * 1000) + 500
    });
    await loading.present();
    await loading.onWillDismiss();
    fab.close();
  }

  async presentToast(text,valid) {
    const toast = await this.toastController.create({
      message: text,
      duration: 1500,
      position: 'middle',
      animated: true,
      color: valid

    });
    toast.present();
  }
}
