import type { NavigatorScreenParams } from '@react-navigation/native';

type RootStackParamList = {
  Root: NavigatorScreenParams<TabNavigatorParamList>;
  PostDetail: { id: string };
  WritePostScreen: { type: 'lost' | 'witnessed' };
};

type TabNavigatorParamList = {
  Lost: undefined;
  Match: undefined;
  Chat: undefined;
  MyPage: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}