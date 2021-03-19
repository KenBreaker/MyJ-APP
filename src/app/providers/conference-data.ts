import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';
import { ToastController } from '@ionic/angular';

import { UserData } from './user-data';
import { Session } from 'protractor';
import { stringify } from '@angular/compiler/src/util';
import { access } from 'fs';
import * as moment from "moment"; 

@Injectable({
  providedIn: 'root'
})
export class ConferenceData {
  access_token = ""

  data = {
    schedule:[{
      groups:[]
    }],
    speakers:[{}],
    tracks:[{
      "name": "Prioridad alta",
      "icon": "logo-angular"
    }]
  };


  constructor(
    public http: HttpClient,
    public userData: UserData,
    public toastController: ToastController,
    public user: UserData) {}

  load(access_token?,dateInit?): any {
    if(access_token){
      this.sendGetName(access_token,dateInit)
      if (this.data) {
        return of(this.data);
      } else {
        return null
        /*
        return this.http
          .get('assets/data/data.json')
          .pipe(map(this.processData, this));
          */
      }

    } else {
      return of(this.data);
    }

  }

  sendGetName(access_token,dateInit?){
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + access_token
        })
      };

    this.http.get("http://10.19.11.9:3003/api/users/current", httpOptions)
      .subscribe(response => {
        //this.presentToast("Se han actualizado las ordenes correctamente!","success");
        let temp:any;
        temp = response
        this.sendGetRequest(access_token,temp.name,dateInit)
       }, error => {
        //this.presentToast("Fallo al intentar actualizar ordenes!","danger");
        console.log(error);
      });
  }

  sendGetRequest(access_token,tech_name,date_init?) {
    let today = moment().format("YYYY-MM-DD");
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + access_token
        })
      };
    if(date_init){
      date_init = date_init
    } else {
      date_init = today
    }
    
    this.http.get("http://10.19.11.9:3003/api/scheduler/cl-orders?date_init="+date_init+"&date_end="+date_init+"&nombre_encargado="+tech_name, httpOptions)
      .subscribe(response => {
        this.presentToast("Se han actualizado las ordenes correctamente!","success");
        let i = 1
        this.data = {
          schedule:[{
            groups:[]
          }],
          speakers:[{}],
          tracks:[{
            "name": "Prioridad alta",
            "icon": "logo-angular"
          }]
        };
        for (let order of Object.entries(response)){
          this.data.schedule[0].groups.push({ time:order[1].disponibilidad, sessions:[
            {
              name:"ID: " + order[1].id + " -- " + order[1].tipo.descripcion + " -- " +order[1].client_residence.direccion,
              location:order[1].client_residence.comuna,
              timeStart:order[1].estadocliente.descripcion,
              timeEnd:order[1].estadoticket.descripcion,
              email: order[1].client_order.email,
              tracks:["Prioridad alta"],
              id: stringify(i),
              order: {data:order[1]}
            }
          ]})
          i += 1
        }
       }, error => {
        this.presentToast("Fallo al intentar actualizar ordenes!","danger");
        console.log(error);
      });
  }
  /*
  processData(data: any) {
    // just some good 'ol JS fun with objects and arrays
    // build up the data by linking speakers to sessions
    this.data = data;

    // loop through each day in the schedule
    this.data.schedule.forEach((day: any) => {
      // loop through each timeline group in the day
      day.groups.forEach((group: any) => {
        // loop through each session in the timeline group
        group.sessions.forEach((session: any) => {
          session.speakers = [];
          if (session.speakerNames) {
            session.speakerNames.forEach((speakerName: any) => {
              const speaker = this.data.speakers.find(
                (s: any) => s.name === speakerName
              );
              if (speaker) {
                session.speakers.push(speaker);
                speaker.sessions = speaker.sessions || [];
                speaker.sessions.push(session);
              }
            });
          }
        });
      });
    });

    return this.data;
  }
  */
  getTimeline(
    dayIndex: number,
    queryText = '',
    excludeTracks: any[] = [],
    segment = 'all',
    access_token,
    dateInit?
  ) {
    return this.load(access_token,dateInit).pipe(
      map((data: any) => {
        const day = data.schedule[dayIndex];
        day.shownSessions = 0;

        queryText = queryText.toLowerCase().replace(/,|\.|-/g, ' ');
        const queryWords = queryText.split(' ').filter(w => !!w.trim().length);

        day.groups.forEach((group: any) => {
          group.hide = true;

          group.sessions.forEach((session: any) => {
            // check if this session should show or not
            this.filterSession(session, queryWords, excludeTracks, segment);

            if (!session.hide) {
              // if this session is not hidden then this group should show
              group.hide = false;
              day.shownSessions++;
            }
          });
        });

        return day;
      })
    );
  }

  filterSession(
    session: any,
    queryWords: string[],
    excludeTracks: any[],
    segment: string
  ) {
    let matchesQueryText = false;
    if (queryWords.length) {
      // of any query word is in the session name than it passes the query test
      queryWords.forEach((queryWord: string) => {
        if (session.name.toLowerCase().indexOf(queryWord) > -1) {
          matchesQueryText = true;
        }
      });
    } else {
      // if there are no query words then this session passes the query test
      matchesQueryText = true;
    }

    // if any of the sessions tracks are not in the
    // exclude tracks then this session passes the track test
    let matchesTracks = false;
    session.tracks.forEach((trackName: string) => {
      if (excludeTracks.indexOf(trackName) === -1) {
        matchesTracks = true;
      }
    });

    // if the segment is 'favorites', but session is not a user favorite
    // then this session does not pass the segment test
    let matchesSegment = false;
    if (segment === 'favorites') {
      if (this.user.hasFavorite(session.name)) {
        matchesSegment = true;
      }
    } else {
      matchesSegment = true;
    }

    // all tests must be true if it should not be hidden
    session.hide = !(matchesQueryText && matchesTracks && matchesSegment);
  }

  getSpeakers() {
    return this.load().pipe(
      map((data: any) => {
        return data.speakers.sort((a: any, b: any) => {
          const aName = a.name.split(' ').pop();
          const bName = b.name.split(' ').pop();
          return aName.localeCompare(bName);
        });
      })
    );
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
  getTracks() {
    return this.load().pipe(
      map((data: any) => {
        return data.tracks.sort();
      })
    );
  }

  getMap() {
    return this.load().pipe(
      map((data: any) => {
        return data.map;
      })
    );
  }
}
