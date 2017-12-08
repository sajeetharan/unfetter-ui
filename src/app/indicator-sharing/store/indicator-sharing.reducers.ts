import * as indicatorSharingActions from './indicator-sharing.actions';
import * as fromApp from '../../root-store/app.reducers'
import { SearchParameters } from '../models/search-parameters';
import { SortTypes } from '../models/sort-types.enum';

export interface IndicatorSharingFeatureState extends fromApp.AppState {
    indicatorSharing: IndicatorSharingState
};

export interface IndicatorSharingState {
    indicators: any[],
    filteredIndicators: any[],
    sensors: any[],
    identities: any[],
    searchParameters: {},
    indicatorToSensorMap: {}
}

export const initialSearchParameters: SearchParameters = {
    indicatorName: '',
    killChainPhases: [],
    labels: [],
    organizations: [],
    sensors: []
};

const initialState: IndicatorSharingState = {
    indicators: [],
    filteredIndicators: [],
    sensors: [],
    identities: [],
    searchParameters: { ...initialSearchParameters },
    indicatorToSensorMap: {}
};

export function indicatorSharingReducer(state = initialState, action: indicatorSharingActions.IndicatorSharingActions) {
    switch (action.type) {
        case indicatorSharingActions.SET_INDICATORS:
            return {
                ...state,
                indicators: action.payload,
                filteredIndicators: action.payload
            };
        case indicatorSharingActions.FILTER_INDICATORS:
            return filterIndicators(state, state.searchParameters);
        case indicatorSharingActions.SORT_INDICATORS:
            return sortIndicators(state, action.payload);
        case indicatorSharingActions.ADD_INDICATOR:            
            return {
                ...state,
                indicators: [
                    ...state.indicators,
                    action.payload
                ]
            };
        case indicatorSharingActions.UPDATE_INDICATOR:
            // TODO update indicatorToSensorMap
            const indicatorToUpdate = state.indicators[action.payload.index];
            const updatedIndicator = {
                ...indicatorToUpdate,
                ...action.payload.indicator
            };
            const iIndicators = [...state.indicators];
            iIndicators[action.payload.index] = updatedIndicator;
            return {
                ...state,
                indicators: iIndicators
            };
        case indicatorSharingActions.DELETE_INDICATOR:
            const indicatorsCopy = [...state.indicators];
            indicatorsCopy.splice(action.payload, 1);
            return {
                ...state,
                indicators: indicatorsCopy
            };
        case indicatorSharingActions.SET_SENSORS:
            const indicatorToSensorMap = buildIndicatorToSensorMap(state.indicators, action.payload);
            return {
                ...state,
                sensors: action.payload,
                indicatorToSensorMap
            };
        case indicatorSharingActions.SET_IDENTITIES:
            return {
                ...state,
                identities: action.payload
            };

        case indicatorSharingActions.SET_SEARCH_PARAMETERS:
            return {
                ...state,
                searchParameters: action.payload
            };
        case indicatorSharingActions.CLEAR_SEARCH_PARAMETERS:
            return {
                ...state,
                searchParameters: { ...initialSearchParameters },
                filteredIndicators: [ ...state.indicators ]
            };
        case indicatorSharingActions.CLEAR_DATA:
            return initialState;
        default:
            return state;
    }
}

function filterIndicators(state, searchParameters) {
    let filteredIndicators;
    if (searchParameters.labels.length) {
        filteredIndicators = [...state.indicators]
            .filter((indicator) => {
                if (indicator.labels !== undefined && indicator.labels.length) {
                    let labelPresent = false;
                    indicator.labels
                        .forEach((label) => {
                            if (searchParameters.labels.includes(label)) {
                                labelPresent = true;
                            }
                        });
                    return labelPresent
                } else {
                    return false;
                }
            });
    } else {
        filteredIndicators = [...state.indicators];
    }

    if (searchParameters.organizations.length) {
        filteredIndicators = filteredIndicators
            .filter((indicator) => indicator.created_by_ref !== undefined && searchParameters.organizations.includes(indicator.created_by_ref));
    }

    if (searchParameters.killChainPhases.length) {
        filteredIndicators = filteredIndicators
            .filter((indicator) => !!indicator.kill_chain_phases)
            .filter((indicator) => {
                let found = false;
                indicator.kill_chain_phases.map((e) => e.phase_name).forEach((phase) => {
                    if (searchParameters.killChainPhases.includes(phase)) {
                        found = true;
                    }
                });
                return found;
            });
    }

    if (searchParameters.indicatorName !== '') {
        filteredIndicators = filteredIndicators
            .filter((indicator) => !!indicator.name)
            .filter((indicator) => indicator.name.toLowerCase().indexOf(searchParameters.indicatorName.toLowerCase()) > -1);
    }

    if (searchParameters.sensors.length) {
        filteredIndicators = filteredIndicators
            .filter((indicator) => indicator.metaProperties && indicator.metaProperties.observedData && Object.keys(state.indicatorToSensorMap).includes(indicator.id))
            .filter((indicator) => state.indicatorToSensorMap[indicator.id]
                .map((sensor) => sensor.id)
                .filter((sensorId) => searchParameters.sensors.includes(sensorId)).length > 0
            );
    }

    return {
        ...state,
        filteredIndicators
    };
}

function sortByArrayLengthHelper(a, b, field): number {
    if (a.metaProperties && a.metaProperties[field] && (!b.metaProperties[field] || !b.metaProperties)) {
        return -1;
    } else if ((!a.metaProperties || !a.metaProperties[field]) && b.metaProperties && b.metaProperties[field]) {
        return 1;
    } else if (a.metaProperties && a.metaProperties[field] && b.metaProperties && b.metaProperties[field]) {
        return b.metaProperties[field].length - a.metaProperties[field].length;
    } else {
        return 0;
    }
}

function sortIndicators(state, sortBy): any[] {
    let filteredIndicators = [ ...state.filteredIndicators ];
    switch (sortBy) {
        case SortTypes.NEWEST:
            filteredIndicators = filteredIndicators.sort((a, b) => {
                return (new Date(b.created) as any) - (new Date(a.created) as any);
            });
            break;
        case SortTypes.OLDEST:
            filteredIndicators = filteredIndicators.sort((a, b) => {
                return (new Date(a.created) as any) - (new Date(b.created) as any);
            });
            break;
        case SortTypes.LIKES:
            filteredIndicators = filteredIndicators.sort((a, b) => sortByArrayLengthHelper(a, b, 'likes'));
            break;
        case SortTypes.COMMENTS:
            filteredIndicators = filteredIndicators.sort((a, b) => sortByArrayLengthHelper(a, b, 'comments'));
            break;
    }
    return {
        ...state,
        filteredIndicators
    };
}

function buildIndicatorToSensorMap(indicators, sensors): object {
    const indicatorToSensorMap = {};
    const indicatorsWithObservedData = indicators.filter((indicator) => indicator.metaProperties && indicator.metaProperties.observedData);

    indicatorsWithObservedData.forEach((indicator) => {
        const matchingSensorsSet = new Set();

        indicator.metaProperties.observedData.forEach((obsData) => {

            const sensorsFilter = sensors
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
            indicatorToSensorMap[indicator.id] = matchingSensors;
        }
    });

    return indicatorToSensorMap;
}
