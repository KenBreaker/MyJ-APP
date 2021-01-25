import { CallNumber } from '@ionic-native/call-number/ngx';
import { Component } from '@angular/core';
import { ConferenceData } from '../../providers/conference-data';
import { ActivatedRoute } from '@angular/router';
import { UserData } from '../../providers/user-data';
import { HttpClient, HttpHeaders} from '@angular/common/http';
import { ToastController,AlertController } from '@ionic/angular';
import { Camera, CameraOptions } from '@ionic-native/camera/ngx';
import { FinalizarOrdenPage } from '../finalizar-orden/finalizar-orden';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'page-session-detail',
  styleUrls: ['./session-detail.scss'],
  templateUrl: 'session-detail.html'
})
export class SessionDetailPage {
  session: any;
  isFavorite = false;
  defaultHref = '';
  mediodepago = ""
  estadoticket = ""
  access_token: string;
  estadocliente = ""
  options: CameraOptions = {
    quality: 100,
    destinationType: this.camera.DestinationType.FILE_URI,
    encodingType: this.camera.EncodingType.JPEG,
    mediaType: this.camera.MediaType.PICTURE
  }
  constructor(
    private dataProvider: ConferenceData,
    private userProvider: UserData,
    private route: ActivatedRoute,
    private callNumber: CallNumber,
    public httpClient: HttpClient,
    public toastController: ToastController,
    public userData: UserData,
    public alertController: AlertController,
    public camera: Camera,
    public modalController: ModalController
  ) { }

  ionViewWillEnter() {
    this.getAccessToken()
    this.dataProvider.load().subscribe((data: any) => {
      if (data && data.schedule && data.schedule[0] && data.schedule[0].groups) {
        const sessionId = this.route.snapshot.paramMap.get('sessionId');
        for (const group of data.schedule[0].groups) {
          if (group && group.sessions) {
            for (const session of group.sessions) {
              if (session && session.id === sessionId) {
                this.session = session;
                this.isFavorite = this.userProvider.hasFavorite(
                  this.session.name
                );

                break;
              }
            }
          }
        }
      }
    });
  }

  forceUpdate(){
    this.getAccessToken()

  }

  ionViewDidEnter() {
    this.defaultHref = `/app/tabs/schedule`;
  }
  updateMediodepago(value,data){
    this.sendPut("mediodepago",value,data)
    this.session.order['data'].mediodepago = value
  }

  updateEstadoTicket(value,data){
    this.sendPut("estadoticket",value,data)
    this.session.timeEnd = value
  }
  updateEstadoCliente(value,data){
    this.sendPut("estadocliente",value,data)
    this.session.timeStart = value
  }
  updateMAC(value,data){
    this.sendPutResidence("client_residence.mac",value,data)
    this.session.order['data'].client_residence.mac = value
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
        this.presentToast("Campo modificado exitosamente","success")
       }, error => {
        this.presentToast("Error, datos ingresados incorrectos","danger")
        console.log(error);
      });
  }

  sendPutResidence(field,value,order) {
    let postData = {
      "id":order['client_residence']['id'],
      "comuna":order['client_residence']['comuna'],
      "direccion":order['client_residence']['direccion'],
      "mac":order['client_residence']['mac'],
      "pppoe":order['client_residence']['pppoe']
  }
  postData[field] = value

    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + this.access_token
        })
      };


    this.httpClient.put("http://10.19.11.9:3005/api/scheduler/residence",postData, httpOptions)
      .subscribe(data => {
        console.log(data)
        this.presentToast("Campo modificado exitosamente","success")
       }, error => {
        this.presentToast("Error, datos ingresados incorrectos","danger")
        console.log(error);
      });
  }

  makeCall(number){
    this.callNumber.callNumber(number, true)
    .then(res => console.log('Launched dialer!', res))
    .catch(err => console.log('Error launching dialer', err));
  }
  sessionClick(item: string) {
    console.log('Clicked', item);
  }

  toggleFavorite() {
    if (this.userProvider.hasFavorite(this.session.name)) {
      this.userProvider.removeFavorite(this.session.name);
      this.isFavorite = false;
    } else {
      this.userProvider.addFavorite(this.session.name);
      this.isFavorite = true;
    }
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

  shareSession() {
    console.log('Clicked share session');
  }
  getAccessToken() {
    this.userData.getAccessToken().then((access_token) => {
      this.access_token = access_token;
    });
  }
  async presentModal() {
    const modal = await this.modalController.create({
      component: FinalizarOrdenPage,
      componentProps: {
        'session': this.session,
      }
    });
    return await modal.present();
  }

  async cambiarMAC(data) {
    const alert = await this.alertController.create({
      //'En Aprobación',session['data']
      header: "Cambio de MAC",
      message: 'La mac debe poseer 12 caracteres',
      inputs: [
        {
          name: 'MAC',
          placeholder: 'Ingrese MAC',
          type: 'text',
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          handler: () => {
            // they clicked the cancel button, do not remove the session
            // close the sliding item and hide the option buttons
          }
        },
        {
          text: 'Confirmar',
          handler : data => {
            if(data.MAC.length!=12){
              this.presentToast("Error! La mac no posee 12 caracteres! modificacion invalida","danger")
            } else {
              this.updateMAC(data.MAC.toUpperCase(),this.session.order['data'])
            }
          }
        }
      ]
    });
    // now present the alert on top of all other content
    await alert.present();
  }

}
