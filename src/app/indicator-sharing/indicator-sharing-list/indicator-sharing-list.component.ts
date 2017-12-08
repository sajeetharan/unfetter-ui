import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/pluck';

import { IndicatorSharingService } from '../indicator-sharing.service';
import { AddIndicatorComponent } from '../add-indicator/add-indicator.component';
import { ConfigService } from '../../core/services/config.service';
import * as fromIndicatorSharing from '../store/indicator-sharing.reducers';
import * as indicatorSharingActions from '../store/indicator-sharing.actions';

@Component({
    selector: 'indicator-sharing-list',
    templateUrl: 'indicator-sharing-list.component.html',
    styleUrls: ['indicator-sharing-list.component.scss']
})

export class IndicatorSharingListComponent implements OnInit, OnDestroy {

    public displayedIndicators: any;
    public allIndicators: any;
    public identities: any[];
    public organizations: any[];
    public filteredIndicators: any;
    public DEFAULT_LENGTH: number = 10;
    public serverCallComplete: boolean = false;
    public indicatorToAttackPatternMap: any = {};
    public SERVER_CALL_COMPLETE = false;
    public sensors: any[];
    public indicatorToSensorMap: any = {};

    constructor(
        private indicatorSharingService: IndicatorSharingService, 
        public dialog: MatDialog,
        private configService: ConfigService,
        private store: Store<fromIndicatorSharing.IndicatorSharingFeatureState>
    ) { }

    public ngOnInit() { 
        const getData$ = Observable.forkJoin(
            this.indicatorSharingService.getIdentities(),
            this.indicatorSharingService.getIndicators(),
            this.indicatorSharingService.getAttackPatternsByIndicator(),
            this.indicatorSharingService.getSensors()
        ).subscribe(
            (results) => {
                // Identities
                this.identities = results[0].map((r) => r.attributes); 
                this.store.dispatch(new indicatorSharingActions.SetIdentities(this.identities));

                this.organizations = this.identities.filter((identity) => identity.identity_class === 'organization');

                // Indicators
                this.allIndicators = results[1].map((res) => res.attributes);
                this.store.dispatch(new indicatorSharingActions.SetIndicators(this.allIndicators));

                const indicatorSub$ = this.store.select('indicatorSharing')
                    .pluck('filteredIndicators')
                    .distinctUntilChanged()
                    .subscribe(
                        (res: any[]) => {
                            this.filteredIndicators = res;
                            this.displayedIndicators = res.slice(0, this.DEFAULT_LENGTH);
                        },
                        (err) => {
                            console.log(err);
                        },
                        () => {
                            indicatorSub$.unsubscribe();
                        }
                    );
                
                // Attack patterns
                results[2].attributes.forEach((res) => {
                    this.indicatorToAttackPatternMap[res._id] = res.attackPatterns;
                });

                // Sensors with observed data paths
                this.sensors = results[3].map((r) => r.attributes);
                this.store.dispatch(new indicatorSharingActions.SetSensors(this.sensors));
                this.buildIndicatorToSensorMap();
            },
            (err) => {
                console.log(err);
            },
            () => {
                this.SERVER_CALL_COMPLETE = true;
                getData$.unsubscribe();
            }
        );
    }    

    public ngOnDestroy() {
        this.dialog.closeAll();
        this.store.dispatch(new indicatorSharingActions.ClearData());
    }

    public updateIndicator(newIndicatorState) {
        const indicatorIndex = this.allIndicators
            .map((indicator) => indicator.id)
            .indexOf(newIndicatorState.id);

        if (indicatorIndex > -1) {
            this.allIndicators[indicatorIndex] = newIndicatorState
        } else {
            console.log('Can not find indicator to update');
        }
    }

    public openDialog() {
        const dialogRef = this.dialog.open(AddIndicatorComponent, {
            width: '800px',
            height: 'calc(100vh - 50px)'
        });

        const dialogRefClose$ = dialogRef.afterClosed()
            .subscribe((res) => {
                    if (res) {
                        this.allIndicators.unshift(res.indicator);
                        this.store.dispatch(new indicatorSharingActions.AddIndicator(res.indicator));
                        if (res.newRelationships) {
                            const getPatterns$ = this.indicatorSharingService.getAttackPatternsByIndicator()
                                    .subscribe((patternsRes) => {
                                        patternsRes.attributes.forEach((e) => {
                                            this.indicatorToAttackPatternMap[e._id] = e.attackPatterns;
                                        });
                                    },
                                    (err) => {
                                        console.log(err);
                                    },
                                    () => {
                                        getPatterns$.unsubscribe();
                                    }
                                );
                        }                        
                        this.buildIndicatorToSensorMap();
                        // TODO handle update in ngrx
                        // this.filterIndicators();
                    }
                },
                (err) => {
                    console.log(err);
                },
                () => {
                    dialogRefClose$.unsubscribe();
                }
            );
    }    

    // public setDisplayedIndicators() {
    //     this.displayedIndicators = this.filteredIndicators.slice(0, this.DEFAULT_LENGTH);
    // }

    public showMoreIndicators() {
        const currentLength = this.displayedIndicators.length;
        this.displayedIndicators = this.displayedIndicators.concat(this.filteredIndicators.slice(currentLength, currentLength + this.DEFAULT_LENGTH));
    }

    public displayShowMoreButton() {
        if (!this.SERVER_CALL_COMPLETE || !this.displayedIndicators || this.displayedIndicators.length === 0) {
            return false;
        } else {
            return (this.displayedIndicators.length + this.DEFAULT_LENGTH) < this.filteredIndicators.length;
        }
    }

    public getAttackPatternsByIndicatorId(indicatorId) {
        return this.indicatorToAttackPatternMap[indicatorId] !== undefined ? this.indicatorToAttackPatternMap[indicatorId] : [];
    }

    public getIdentityNameById(createdByRef) {
        const identityMatch = this.identities && this.identities.length > 0 ? this.identities.find((identity) => identity.id === createdByRef) : null;
        
        if (identityMatch && identityMatch.name !== undefined) {
            return { id: identityMatch.id, name: identityMatch.name};
        } else {
            return false;
        }
    }

    public getSensorsByIndicatorId(indicatorId) {
        if (Object.keys(this.indicatorToSensorMap).includes(indicatorId)) {
            return this.indicatorToSensorMap[indicatorId];
        } else {
            return null;
        }
    }

    private buildIndicatorToSensorMap() {
        const indicatorsWithObservedData = this.allIndicators.filter((indicator) => indicator.metaProperties && indicator.metaProperties.observedData);

        indicatorsWithObservedData.forEach((indicator) => {   
            const matchingSensorsSet = new Set();

            indicator.metaProperties.observedData.forEach((obsData) => {

                const sensorsFilter = this.sensors
                    .filter((sensor) => {
                        let retVal = false;
                        sensor.metaProperties.observedData.forEach((sensorObsData) => {
                            if (sensorObsData.name === obsData.name && sensorObsData.action === obsData.action && sensorObsData.property === obsData.property) {
                                retVal = true;
                            }
                        });
                        return retVal;
                    })
                    .forEach((sensor) => matchingSensorsSet.add(sensor));
            });

            const matchingSensors = Array.from(matchingSensorsSet);

            if (matchingSensors.length) {
                this.indicatorToSensorMap[indicator.id] = matchingSensors;
            }
        });
    }
}
