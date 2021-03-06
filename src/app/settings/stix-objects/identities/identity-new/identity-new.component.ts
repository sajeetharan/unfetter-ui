import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Location } from '@angular/common';
import { MatDialog, MatDialogRef, MatDialogConfig, MatSnackBar } from '@angular/material';
import { IdentityEditComponent } from '../identity-edit/identity-edit.component';
import { StixService } from '../../../stix.service';
import { Identity } from '../../../../models';
import { ConfigService } from '../../../../core/services/config.service';

@Component({
  selector: 'identity-new',
  styles: [
        ' .identity-radio-group {display: inline-flex; flex-direction: column;}',
        '.identity-radio-button {margin: 5px;}',
        '.identity-selected-value { margin: 15px 0;}'
 ],
  templateUrl: './identity-new.component.html',
})
export class IdentityNewComponent extends IdentityEditComponent implements OnInit {

    constructor(
        public stixService: StixService,
        public route: ActivatedRoute,
        public router: Router,
        public dialog: MatDialog,
        public location: Location,
        public snackBar: MatSnackBar,
        public configService: ConfigService
    ) {
        super(stixService, route, router, dialog, location, snackBar, configService);
    }

    public ngOnInit() {
        this.identity = new Identity();
    }

     public saveIdentity(): void {
         let sub = super.create(this.identity).subscribe(
            (data) => {
                this.location.back();
            }, (error) => {
                // handle errors here
                 console.log('error ' + error);
            }, () => {
                // prevent memory links
                if (sub) {
                    sub.unsubscribe();
                }
            }
        );
    }

}
