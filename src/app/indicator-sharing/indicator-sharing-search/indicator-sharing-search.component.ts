import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { Store } from '@ngrx/store';

import * as fromIndicatorSharing from '../store/indicator-sharing.reducers';
import * as indicatorSharingActions from '../store/indicator-sharing.actions';

@Component({
    selector: 'indicator-sharing-search',
    templateUrl: 'indicator-sharing-search.component.html',
    styleUrls: ['indicator-sharing-search.component.scss']
})
export class IndicatorSharingSearchComponent implements OnInit {

    public searchForm = new FormGroup({
        indicatorName: new FormControl(''),
        labels: new FormControl([]),
        killChainPhases: new FormControl([]),
        organizations: new FormControl([]),
        sensors: new FormControl([])
    });
    public sortBy: string = 'NEWEST';
    public killChainPhases$;
    public labels$;

    constructor(public store: Store<fromIndicatorSharing.IndicatorSharingFeatureState>) { }   

    public ngOnInit() {
        const searchChanges$ = this.searchForm.valueChanges
            .debounceTime(300)
            .subscribe((res) => {
                    this.store.dispatch(new indicatorSharingActions.FilterIndicators(res));
                },
                (err) => {
                    console.log(err);
                },
                () => {
                    searchChanges$.unsubscribe();
                }
            );

        this.killChainPhases$ = this.store.select('config')
            .pluck('configurations')
            .filter((configurations: any) => configurations.killChains !== undefined)
            .pluck('killChains')
            .filter((killChains: any) => killChains.find((kc) => kc.name === 'mitre-attack') !== null)
            .map((killChains: any) => killChains.find((kc) => kc.name === 'mitre-attack').phase_names);

        this.labels$ = this.store.select('indicatorSharing')
            .pluck('indicators')
            .map((indicators: any) => { 
                return indicators
                    .filter((indicator) => indicator.labels && indicator.labels.length)
                    .map((indicator) => indicator.labels)
                    .reduce((prev, cur) => prev.concat(cur), []);
            })
            .map((labels) => {
                const labelSet = new Set(labels);
                return Array.from(labelSet);
            });
    }

    public sortIndicators() {
        this.store.dispatch(new indicatorSharingActions.SortIndicators(this.sortBy));
    }
}
