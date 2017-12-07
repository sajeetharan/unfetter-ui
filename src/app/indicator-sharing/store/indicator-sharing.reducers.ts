import * as indicatorSharingActions from './indicator-sharing.actions';

export interface IndicatorSharingState {
    indicators: any[],
    sensors: any[],
    identities: any[]
}

const initialState: IndicatorSharingState = {
    indicators: [],
    sensors: [],
    identities: []
};

export function indicatorSharingReducer(state = initialState, action: indicatorSharingActions.IndicatorSharingActions) {
    switch (action.type) {
        case indicatorSharingActions.SET_INDICATORS:
            return {
                ...state,
                indicators: action.payload
            };
        case indicatorSharingActions.ADD_INDICATOR:
            
            return {
                ...state,
                indicators: [
                    ...state.indicators,
                    action.payload
                ]
            };
        case indicatorSharingActions.UPDATE_INDICATOR:
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
            return {
                ...state,
                sensors: action.payload
            };
        case indicatorSharingActions.SET_IDENTITIES:
            return {
                ...state,
                identities: action.payload
            };
        case indicatorSharingActions.CLEAR_DATA:
            return initialState;
        default:
            return state;
    }
}
