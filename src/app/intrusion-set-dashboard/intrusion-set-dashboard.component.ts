
import { Component, OnInit } from '@angular/core';
import { CheckboxModule } from 'primeng/primeng';
import { Observable } from 'rxjs/Observable';
import { MdDialog, MdDialogRef, MdSnackBar } from '@angular/material';

import { Constance } from '../utils/constance';
import { IntrusionSetComponent } from '../intrusion-set/intrusion-set.component';
import { StixService } from '../stix/stix.service';
import { BaseStixService } from '../stix/base-stix.service';
import { IntrusionSet } from '../models';

@Component({
  selector: 'intrusion-set-dashboard',
  templateUrl: 'intrusion-set-dashboard.component.html',
})
export class IntrusionSetDashboardComponent implements OnInit {

  private duration = 3000;
  private intrusionSets: IntrusionSet[] = [];
  protected selectedIntrusionSet = {};

  constructor(
    protected service: StixService,
    protected snackBar: MdSnackBar) {
  }

  public ngOnInit() {
    console.log('intrusion set dashboard init');
    this.service.url = Constance.INTRUSION_SET_URL;
    let filter = 'filter[order]=name';
    this.service.load(filter).subscribe(
      (data) => {
        this.intrusionSets = data;
      }, (error) => {
        // handle errors here
        console.log('error ' + error);
      }
    );
  }

  protected select(intrusionSet) : void {
    this.selectedIntrusionSet = intrusionSet.attributes;
  }

}
