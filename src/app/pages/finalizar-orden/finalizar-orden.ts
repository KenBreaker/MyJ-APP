import { Component, Input } from '@angular/core';
import { ConferenceData } from '../../providers/conference-data';
import { ActivatedRoute } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { UserData } from '../../providers/user-data';
import { Camera, CameraOptions } from '@ionic-native/camera/ngx';
import { AlertController } from '@ionic/angular';
import { HttpClient, HttpHeaders} from '@angular/common/http';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'page-finalizar-orden',
  templateUrl: './finalizar-orden.component.html',
  styleUrls: ['./finalizar-orden.component.scss'],
})
export class FinalizarOrdenPage{
  @Input() session: string;
  isFavorite = false;
  defaultHref = `/app/tabs/schedule`;
  access_token = '';
  images = [];
  photo = '';
  options: CameraOptions = {
    quality: 100,
    destinationType: this.camera.DestinationType.FILE_URI,
    encodingType: this.camera.EncodingType.JPEG,
    mediaType: this.camera.MediaType.PICTURE,
    sourceType: this.camera.PictureSourceType.CAMERA,
    correctOrientation: true
  }
  constructor(
    private dataProvider: ConferenceData,
    private userProvider: UserData,
    public userData: UserData,
    private route: ActivatedRoute,
    public modalController: ModalController,
    public camera: Camera,
    public alertController: AlertController,
    public httpClient: HttpClient,
    public toastController: ToastController) { }

  ionViewWillEnter(){
    this.getAccessToken();
  }

  shareSession() {
    console.log('Clicked share session');
  }

  getAccessToken() {
    this.userData.getAccessToken().then((access_token) => {
      this.access_token = access_token;
    });
  }
  dismiss() {
    this.modalController.dismiss({
      'dismissed': true
    });
  }
  async takePhoto(){
    this.photo = await this.camera.getPicture(this.options);
    let displayedImg = (<any>window).Ionic.WebView.convertFileSrc(this.photo);
    this.images.push(displayedImg)
  }

  updateEstadoTicket(value,data){
    this.sendPut("estadoticket",value,data)
  }

  sendPut(field,value,order) {
    let postData = {
      "id":order['id'],
      "idtipo":order['tipo']['id'],
      "prioridad":order['prioridad'],
      "disponibilidad":order['disponibilidad'],
      "comentario":order['comentario'],
      "fechaejecucion":order['fechaejecucion'],
      "estadocliente":order['estadocliente'],
      "estadoticket":order['estadoticket'],
      "mediodepago":order['mediodepago'],
      "monto":order['monto'],
      "created_by":order['created_by']['email'],
      "encargado":order['encargado']['rut'],
      "client_order":order['client_order']['rut'],
      "domicilio":order['client_residence']['id']

  }
  postData[field] = value

    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + this.access_token
        })
      };


    this.httpClient.put("http://10.19.11.9:3005/api/scheduler/order",postData, httpOptions)
      .subscribe(data => {
        console.log(data)
        this.presentToast("Solicitud enviada correctamente","success")
       }, error => {
        this.presentToast("Error, al enviar solicitud!","danger")
        console.log(error);
      });
  }

  async confirmarSolicitud(data) {
    const alert = await this.alertController.create({
      //'En Aprobación',session['data']
      header: "Confirmar solicitud",
      message: 'Desea solicitar la aprobación de esta orden?',
      buttons: [
        {
          text: 'Cancelar',
          handler: () => {
          }
        },
        {
          text: 'Confirmar',
          handler: () => {
            this.updateEstadoTicket("En Aprobación",data)
          }
        }
      ]
    });
    // now present the alert on top of all other content
    await alert.present();
  }
  async presentToast(text,valid) {
    const toast = await this.toastController.create({
      message: text,
      duration: 3000,
      position: 'bottom',
      animated: true,
      color: valid,
      translucent: true

    });
    toast.present();
  }
}
