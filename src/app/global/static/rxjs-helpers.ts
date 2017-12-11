import { Observable } from 'rxjs/Observable';
import { Store } from '@ngrx/store';

export class RxjsHelpers {

    // Adapter for JSONapi attributes
    public static mapArrayAttributes(arr: any[]) {
        return arr.map((el) => {
            if (el instanceof Array) {
                return el.map((e) => e.attributes);
            } else if (el instanceof Object) {
                return el.attributes;
            } else {
                return el;
            }
        })
    }

    // Helper function for getting specific configurations from the ngrx store
    public static getNgrxConfigKey(store: Store<any>, configKey: string): Observable<any> {
        return store.select('config')
            .pluck('configurations')
            .filter((configurations: any) => !!configurations[configKey])
            .pluck(configKey)
            .distinctUntilChanged();
    }
}
