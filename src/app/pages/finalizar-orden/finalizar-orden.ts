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
  @Input() session: any;
  isFavorite = false;
  defaultHref = `/app/tabs/schedule`;
  access_token = '';
  images = [];
  comentario = "";
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
    this.sendGetName(this.access_token,data)
    this.sendPut("estadoticket",value,data)
    this.dismiss()
  }

  sendTracking(value,user,order) {
    let postData = {
      "comentario":value,
      "user_email": user,
      "order_id":order['id']
  }

    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + this.access_token
        })
      };

    this.httpClient.post("http://10.19.11.9:3003/api/scheduler/seguimientos",postData, httpOptions)
      .subscribe(data => {
        //this.presentToast("Comentario añadido correctamente","success")
       }, error => {
        this.presentToast("Error, al enviar solicitud!","danger")
        console.log(error);
      });
  }

  sendGetName(access_token,data){
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + access_token
        })
      };

    this.httpClient.get("http://10.19.11.9:3003/api/users/current", httpOptions)
      .subscribe(response => {
        //this.presentToast("Se han actualizado las ordenes correctamente!","success");
        let temp:any;
        temp = response
        if(this.comentario){
          this.sendTracking(this.comentario,temp.email,data)
        } else {
          this.sendTracking("Solicitud de Aprobacion",temp.email,data)
        }
        
       }, error => {
        //this.presentToast("Fallo al intentar actualizar ordenes!","danger");
        console.log(error);
      });
  }

  sendPut(field,value,order) {
    let postData = {
      "id":order['id'],
      "idtipo":order['tipo']['id'],
      "prioridad":order['prioridad']['id'],
      "disponibilidad":order['disponibilidad'],
      "comentario":order['comentario'],
      "fechaejecucion":order['fechaejecucion'],
      "estadocliente":order['estadocliente']['id'],
      "estadoticket":order['estadoticket']['id'],
      "mediodepago":order['mediodepago']['id'],
      "monto":order['monto'],
      "created_by":order['created_by']['email'],
      "encargado":order['encargado']['rut'],
      "client_order":order['client_order']['rut'],
      "domicilio":order['client_residence']['id']
      
  }
  postData[field] = value
  console.log(postData)
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + this.access_token
        })
      };

    this.httpClient.put("http://10.19.11.9:3003/api/scheduler/order",postData, httpOptions)
      .subscribe(data => {
        this.presentToast("Solicitud de aprobacion enviada correctamente","success")
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
            this.updateEstadoTicket("6",data)
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
