import { Component } from '@angular/core';
import { NavController, ActionSheetController, AlertController } from 'ionic-angular';
import { FreeboxService } from '../../providers/freebox-service';
import { CommonService } from '../../providers/common-service';
import { ISubscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';

@Component({
    selector: 'page-download',
    templateUrl: 'download.html',
    providers: [FreeboxService, CommonService]
})
export class DownloadPage {

    private downloads:any = [];
    private noDownload:boolean;
    private subscriptionTimer:ISubscription;
    private firstLoad:boolean;

    constructor(public navCtrl: NavController, private freeboxService: FreeboxService,
                private commonService: CommonService, private actionsheetCtrl: ActionSheetController,
                private alertCtrl: AlertController) {

    }

    ionViewDidEnter () {
        this.downloads = [];
        this.noDownload = false;
        this.firstLoad = true;
        this.commonService.getGranted().then(granted => {
            if (granted) {
                this.commonService.loadingShow('Please wait...');
                this.subscriptionTimer = Observable.interval(3000).subscribe(x => {
                    if (!this.noDownload) {
                        this.showDownloads();
                    }
                });
            }
        });
    }

    ionViewDidLeave () {
        this.subscriptionTimer.unsubscribe ();
    }

    showDownloads() {
        this.freeboxService.getDownloads().then(downloads => {
            if (downloads) {
                this.downloads = downloads;
                if (this.downloads.length > 0) {
                    this.noDownload = false;
                } else {
                    this.noDownload = true;
                }
            }
            if (this.firstLoad) {
                this.firstLoad = false;
                this.commonService.loadingHide();
            }
        });
    }

    openMenu(download) {
        let statusButton:any;
        if (download.status=='stopped') {
            statusButton = {
                text: 'Play',
                icon: 'play',
                handler: () => {
                    this.play(download);
                }
            }
        } else {
            statusButton = {
                text: 'Pause',
                icon: 'pause',
                handler: () => {
                    this.pause(download);
                }
            }
        }
        let buttons:any = [
            statusButton,
            {
                text: 'Delete',
                role: 'destructive',
                icon: 'trash',
                handler: () => {
                    this.showConfirmDelete(download);
                }
            },
            {
                text: 'Cancel',
                role: 'cancel',
                icon: 'close',
                handler: () => {
                    console.log('cancel');
                }
            }
        ];
        let actionSheet = this.actionsheetCtrl.create({
            title: download.title,
            cssClass: 'action-sheets-basic-page',
            buttons: buttons
        });
        actionSheet.present();
    }

    showConfirmDelete(download) {
        let confirm = this.alertCtrl.create({
            title: 'Suppression',
            message: 'Confirmez-vous la suppression de "'+download.title + '" ?',
            buttons: [
                {
                    text: 'Oui',
                    handler: () => {
                        this.delete(download);
                    }
                },
                {
                    text: 'Non',
                    handler: () => {
                        //console.log('Non');
                    }
                }
            ]
        });
        confirm.present();
    }

    delete(download) {
        this.commonService.loadingShow('Please wait...');
        this.freeboxService.deleteDownload(download.id).then(deleted => {
            if (!deleted['success']) {
                this.commonService.toastShow('Erreur de suppression.');
            }
            this.commonService.loadingHide();
        });
    }

    pause(download) {
        this.commonService.loadingShow('Please wait...');
        let param: any = {
            "status": "stopped"
        };
        this.freeboxService.setStatusDownload(download.id, param).then(pause => {
            if (!pause['success']) {
                this.commonService.toastShow('Erreur lors de la mise en pause.');
            }
            this.commonService.loadingHide();
        });
    }

    play(download) {
        this.commonService.loadingShow('Please wait...');
        let param: any = {
            "status": "downloading"
        };
        this.freeboxService.setStatusDownload(download.id, param).then(play => {
            if (!play['success']) {
                this.commonService.toastShow('Erreur lors de la reprise.');
            }
            this.commonService.loadingHide();
        });
    }

}