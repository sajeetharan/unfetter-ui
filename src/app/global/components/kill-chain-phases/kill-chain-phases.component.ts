import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/pluck';
import 'rxjs/add/operator/filter';

import { KillChainPhasesForm } from '../../form-models/kill-chain-phases';
import { heightCollapse } from '../../animations/height-collapse';
import * as fromApp from '../../../root-store/app.reducers';
import { RxjsHelpers } from '../../static/rxjs-helpers';

@Component({
    selector: 'kill-chain-phases-reactive',
    templateUrl: 'kill-chain-phases.component.html',
    styleUrls: ['kill-chain-phases.component.scss'],
    animations: [heightCollapse]
})

export class KillChainPhasesReactiveComponent implements OnInit {

    @Input() public parentForm: any;

    public localForm: FormGroup;
    public showKillChainPhases: boolean = false;
    public killChainRaw: any[] = []
    public killChainNames: string[] = [];
    public distinctKillChainPhases: string[] = [];
    public formResetComplete = true;

    constructor(
        private changeDetectorRef: ChangeDetectorRef,
        private store: Store<fromApp.AppState>
    ) { }

    public ngOnInit() {
        this.resetForm();
        const configSub$ = RxjsHelpers.getNgrxConfigKey(this.store, 'killChains')
            .subscribe(
                (res: any[]) => {
                    this.killChainRaw = res;
                    this.killChainNames = res.map((kc) => kc.name);
                    this.distinctKillChainPhases = res
                        .map((kc) => kc.phase_names)
                        .reduce((prev, cur) => prev.concat(cur), [])
                        .filter((phase, pos, arr) => arr.indexOf(phase) === pos);
                },
                (err) => {
                    console.log(err);
                },
                () => {
                    configSub$.unsubscribe();
                }
            );
    }

    public resetForm() {
        this.localForm = KillChainPhasesForm();
    }

    public getDisplayedKillchains() {
        const matchingKillchain = this.killChainRaw.find((kc) => kc.name.toLowerCase() === this.localForm.get('kill_chain_name').value.toLowerCase());
        if (!matchingKillchain) {
            return this.distinctKillChainPhases;
        } else {
            return matchingKillchain.phase_names;
        }
    }

    public addToParent() {
        this.parentForm.get('kill_chain_phases').push(this.localForm);
        this.formResetComplete = false;
        this.resetForm();
        this.changeDetectorRef.detectChanges(); // To force rerender of angular material inputs
        this.formResetComplete = true;  
    }
}
