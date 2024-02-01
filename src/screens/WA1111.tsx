/**-------------------------------------------
 * A01-0110_旧タグID参照(灰)
 * WA1111
 * screens/WA1111.tsx
 * ---------------------------------------------*/
import FunctionHeader from '../components/FunctionHeader.tsx'; // Headerコンポーネントのインポート
import Footer from '../components/Footer.tsx'; // Footerコンポーネントのインポート
import {styles} from '../styles/CommonStyle.tsx'; // 共通スタイル
import React, {useEffect} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {logUserAction, logScreen} from '../utils/Log.tsx';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootList} from '../navigation/AppNavigator.tsx';
import {useRecoilValue, useSetRecoilState} from 'recoil';
import {WA1110DataState, WA1111BackState} from '../atom/atom.tsx';
import {CT0054} from '../enum/enums.tsx';

// WA1111 用の navigation 型
type NavigationProp = StackNavigationProp<RootList, 'WA1111'>;
interface Props {
  navigation: NavigationProp;
}
const WA1111 = ({navigation}: Props) => {
  const WA1110Data = useRecoilValue(WA1110DataState); // Recoil 旧タグID情報
  const setBack = useSetRecoilState(WA1111BackState); // Recoil 戻る
  /************************************************
   * 初期表示設定
   ************************************************/
  useEffect(() => {}, []);

  /************************************************
   * 戻るボタン処理
   ************************************************/
  const btnAppBack = async () => {
    await logUserAction('ボタン押下: 戻る(WA1111)');
    setBack(true);
    await logScreen('画面遷移:WA1110_旧タグ参照(灰)');
    navigation.navigate('WA1110');
  };

  /************************************************
   * メニューボタン処理
   ************************************************/
  const btnMenu = async () => {
    await logUserAction('ボタン押下: メニュー(WA1111)');
    await logScreen('画面遷移:WA1040_メニュー');
    navigation.navigate('WA1040');
  };

  return (
    <View style={styles.container}>
      {/* ヘッダ */}
      <FunctionHeader
        appType={'現'}
        viewTitle={'旧タグ参照'}
        functionTitle={'参照(灰)'}
      />

      {/* 上段 */}
      <View style={[styles.main]}>
        <Text style={[styles.labelText]}>
          作業場所：{WA1110Data?.head.wkplcTyp}
        </Text>
        <Text style={[styles.labelText, styles.labelTextPlace]}>
          {WA1110Data?.head.wkplc}
        </Text>
        <Text style={[styles.labelText]}>
          旧タグID：{WA1110Data?.head.oldTagId}
        </Text>
      </View>

      {/* 中段 */}
      <View style={[styles.textareaContainer, styles.topContent]}>
        <View style={styles.tableMain}>
          <View style={styles.tableRow}>
            <View style={styles.tableCell}>
              <Text style={[styles.labelText, styles.alignRight]}>
                焼却灰種別：
              </Text>
            </View>
            <View style={styles.tableCell}>
              <Text style={styles.labelText}>
                {CT0054[WA1110Data?.data.ashTyp as number]}
              </Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableCell}>
              <Text style={[styles.labelText, styles.alignRight]}>
                測定放射能濃度：
              </Text>
            </View>
            <View style={styles.tableCell}>
              <Text style={styles.labelText}>{WA1110Data?.data.meaRa}</Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableCell}>
              <Text style={[styles.labelText, styles.alignRight]}>
                (Bq/Kg)　
              </Text>
            </View>
            <View style={styles.tableCell}>
              <Text style={styles.labelText} />
            </View>
          </View>
        </View>
      </View>

      {/* 下段 */}
      <View style={[styles.bottomSection, styles.settingMain]}>
        <TouchableOpacity
          style={[styles.button, styles.settingButton, styles.settingButton3]}
          onPress={btnAppBack}>
          <Text style={styles.endButtonText}>戻る</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.settingButton, styles.settingButton]}
          onPress={btnMenu}>
          <Text style={[styles.endButtonText, styles.settingButtonText1]}>
            メニュー
          </Text>
        </TouchableOpacity>
      </View>

      {/* フッタ */}
      <Footer />
    </View>
  );
};
export default WA1111;
