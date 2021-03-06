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

    private shareMode:boolean;
    private downloads:any = [];
    private noDownload:boolean;
    private noFullDownload:boolean;
    private noDownloadMessage:string;
    private subscriptionTimer:ISubscription;
    private firstLoad:boolean;

    constructor(public navCtrl: NavController, private freeboxService: FreeboxService,
                private commonService: CommonService, private actionsheetCtrl: ActionSheetController,
                private alertCtrl: AlertController) {
        this.noDownload = false;
        this.noDownloadMessage = "";
    }

    ionViewDidEnter () {
        this.shareMode = false;
        this.downloads = [];
        this.noDownload = false;
        this.noFullDownload = false;
        this.noDownloadMessage = "";
        this.firstLoad = true;
        this.commonService.getGranted().then(granted => {
            if (granted) {
                this.commonService.loadingShow('Please wait...');
                this.subscriptionTimer = Observable.interval(2500).subscribe(x => {
                    if (!this.noFullDownload) {
                        this.showDownloads();
                    }
                });
            }
        });
    }

    onChangeMode() {
        this.commonService.loadingShow('Please wait...');
        this.firstLoad = true;
        this.downloads = [];
        if (this.noFullDownload) {
            this.showDownloads();
        }
    }

    ionViewDidLeave () {
        this.subscriptionTimer.unsubscribe ();
    }

    showDownloads() {
        this.freeboxService.getDownloads().then(downloads => {
            if (downloads) {
                const allDownloadModel:any = downloads;
                if (allDownloadModel.length > 0) {
                    this.noFullDownload = false;
                    this.downloads = allDownloadModel.filter((downloadModel) =>
                        downloadModel.shareStatus == this.shareMode
                    );
                } else {
                    this.downloads = [];
                    this.noFullDownload = true;
                }
                if (this.downloads.length > 0) {
                    this.noDownload = false;
                } else {
                    if (this.shareMode) {
                        this.noDownloadMessage = 'Aucun partage en cours.';
                    } else {
                        this.noDownloadMessage = 'Aucun téléchargement en cours.';
                    }
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
            this.firstLoad = true;
            if (!deleted['success']) {
                this.commonService.toastShow('Erreur de suppression.');
            }
        });
    }

    pause(download) {
        this.commonService.loadingShow('Please wait...');
        let param: any = {
            "status": "stopped"
        };
        this.freeboxService.setStatusDownload(download.id, param).then(pause => {
            this.firstLoad = true;
            if (!pause['success']) {
                this.commonService.toastShow('Erreur lors de la mise en pause.');
            }
        });
    }

    play(download) {
        this.commonService.loadingShow('Please wait...');
        let param: any = {
            "status": "downloading"
        };
        this.freeboxService.setStatusDownload(download.id, param).then(play => {
            this.firstLoad = true;
            if (!play['success']) {
                this.commonService.toastShow('Erreur lors de la reprise.');
            }
        });
    }

}
