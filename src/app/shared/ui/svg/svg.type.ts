import {ICON_NAME} from './svg-icon-constants';

export type SvgIcon = (typeof ICON_NAME)[keyof typeof ICON_NAME]
