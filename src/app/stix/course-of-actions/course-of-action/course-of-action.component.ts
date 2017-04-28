import { Component, OnInit } from '@angular/core';
import { MdDialog, MdDialogRef } from '@angular/material';
import { Router, ActivatedRoute } from '@angular/router';
import { BaseStixComponent } from '../../base-stix.component';
import { StixService } from '../../stix.service';
import { CourseOfAction } from '../../../models';

@Component({
    selector: 'course-of-action',
    templateUrl: './course-of-action.component.html'
})
export class CourseOfActionComponent extends BaseStixComponent implements OnInit {
    private courseOfAction: CourseOfAction = new CourseOfAction();

     constructor(
        public stixService: StixService,
        public route: ActivatedRoute,
        public router: Router,
        public dialog: MdDialog) {

        super(stixService, route, router, dialog);
        stixService.url = 'api/threat-actors';

        console.log('Initial CourseOfActionComponent');
    }

    public ngOnInit() {
        console.log('Initial CourseOfActionComponent');
        let subscription =  super.get().subscribe(
            (data) => {
                this.courseOfAction = data as CourseOfAction;
                console.dir(this.courseOfAction );
            }, (error) => {
                // handle errors here
                 console.log('error ' + error);
            }, () => {
                // prevent memory links
                if (subscription) {
                    subscription.unsubscribe();
                }
            }
        );
    }

    public editButtonClicked(): void {
        let link = ['../edit', this.courseOfAction.id];
        super.gotoView(link);
    }

    public deleteButtonClicked(): void {
        super.openDialog(this.courseOfAction);
    }
}
