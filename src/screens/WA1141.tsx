/**-------------------------------------------
 * A01-0140_定置登録
 * WA1141
 * screens/WA1141.tsx
 * ---------------------------------------------*/
import FunctionHeader from '../components/FunctionHeader.tsx'; // Headerコンポーネントのインポート
import Footer from '../components/Footer.tsx'; // Footerコンポーネントのインポート
import { styles } from '../styles/CommonStyle.tsx'; // 共通スタイル
import React, { useState,useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { logUserAction, logScreen  } from '../utils/Log.tsx';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootList } from '../navigation/AppNavigator.tsx';
import { useRecoilValue,useSetRecoilState,useRecoilState} from "recoil";
import { WA1140DataState,WA1141BackState,WA1140PrevScreenId } from "../atom/atom.tsx";
import { CT0007} from "../enum/enums.tsx";
import { Picker } from '@react-native-picker/picker';
import { getInstance } from '../utils/Realm.tsx'; // realm.jsから関数をインポート
import { useAlert } from '../components/AlertContext.tsx';
import messages from '../utils/messages.tsx';
import ProcessingModal from '../components/Modal.tsx';
import {getCurrentDateTime} from '../utils/common.tsx'
import { IFT0140 } from '../utils/Api.tsx'; 
// WA1141 用の navigation 型
type NavigationProp = StackNavigationProp<RootList, 'WA1141'>;
interface Props {
  navigation: NavigationProp;
};
interface PickerOption {
  label: string;
  value: string;
}
const WA1141 = ({navigation}:Props) => {
    const [ WA1140Data, setWA1140Data ] = useRecoilState(WA1140DataState);
    const setBack = useSetRecoilState(WA1141BackState);
    const [prevScreenId,setPrevScreenId] = useRecoilState(WA1140PrevScreenId);//遷移元画面ID
    const [selectStySec,setSelectStySec] = useState<string>('');
    const [selectAreNo,setSelectAreNo] = useState<string>('');
    const [selectNos,setSelectNos] = useState<string>('');
    const [stySec,setStySec] = useState<string>('');
    const [areNo,setAreNo] = useState<string>('');
    const [isStySecFocused,setIsStySecFocused] = useState<boolean>(false);
    const [isAreNoFocused,setIsAreNoFocused] = useState<boolean>(false);
    const [isNosFocused,setIsNosFocused] = useState<boolean>(false);
    const [isSendDisabled,setIsSendDisabled] = useState<boolean>(false);
    const [stySecOptions, setStySecOptions] = useState<PickerOption[]>([]);
    const { showAlert } = useAlert();
    const [modalVisible, setModalVisible] = useState<boolean>(false);

    const realm = getInstance();
    /************************************************
     * 初期表示設定
     ************************************************/   
    useEffect(() => {
      updateStySecOptions('1'); // 初期ロード時に選択肢をセットする
      isSend();//次へボタンの活性・非活性
    }, []);

    /************************************************
     * 破棄ボタン処理
     ************************************************/
    const btnAppDestroy = async () => {
      await logUserAction(`ボタン押下: 破棄(WA1141)`);
      setBack(true);
      setPrevScreenId("WA1040");
      await logScreen(`画面遷移:WA1140_新タグ読込(定置登録)`);  
      navigation.navigate('WA1140');
    };

    /************************************************
     * 送信ボタン処理
     ************************************************/
    const btnAppSend = async () => {
      await logUserAction(`ボタン押下: 送信(WA1141)`);
      //段数で選択された値が、除去土壌種別ごとの閾値を超える場合
      const settingsInfo = realm.objects('settings')[0]
      let maxNos = 0;
      switch(WA1140Data.rmSolTyp){
        case '1':
          maxNos = settingsInfo.selPlans as number;
          break;
        case '2':
          maxNos = settingsInfo.selCombust as number;
          break;
        case '3':
          maxNos = settingsInfo.selSoil as number;
          break;
        case '4':
          maxNos = settingsInfo.selConcrete as number;
          break;
        case '5':
          maxNos = settingsInfo.selAsphalt as number;
          break;
        case '6':
          maxNos = settingsInfo.selNoncombustMix as number;
          break;
        case '7':
          maxNos = settingsInfo.selAsbestos as number;
          break;
        case '8':
          maxNos = settingsInfo.selPlasterboard as number;
          break;
        case '9':
          maxNos = settingsInfo.selHazard as number;
          break;
        case '10':
          maxNos = settingsInfo.selOutCombust as number;
          break;
        case '11':
          maxNos = settingsInfo.selOutNoncombust as number;
          break;
        case '12':
          maxNos = settingsInfo.selTmpCombust as number;
          break;
        case '13':
          maxNos = settingsInfo.selTmpNoncombust as number;
          break;
        case '14':
          maxNos = settingsInfo.selAsh as number;
          break;
      }
      if(Number(selectNos) > maxNos){
        await showAlert("通知", messages.EA5024(String(maxNos)), false);
        return;
      }
      setModalVisible(true);
      const dateStr = getCurrentDateTime();
      //一時記憶領域の[定置区画ID]、[区域番号]、[段数]に設定
      setWA1140Data({...WA1140Data,
        stySec:selectStySec,
        areNo:selectAreNo,
        nos:selectNos,
      })
      //IFT0140実行
      const responseIFA0140 = await IFT0140(
        WA1140Data,
        dateStr,
      );
      
      setModalVisible(false);
      await logScreen(`画面遷移:WA1040_メニュー`);  
      navigation.navigate('WA1040');
    };

    /************************************************
     * ボタン表示・非表示判断
     ************************************************/   
    const getButtonStyle = () => {
      return (isSendDisabled) ? [styles.button, styles.settingButton,styles.settingButtonDisabled] : [styles.button, styles.settingButton,styles.settingButton]
    };
    //ボタン活性化
    const isSend = () =>{
      if(selectAreNo && selectAreNo && selectNos){
        setIsSendDisabled(false);
      }else{
        setIsSendDisabled(true);
      }
    }
    //区域番号選択肢作成
    const updateStySecOptions = (ptn:string) => {
      let fixedPlacesInfoInfo;
      if(ptn === '1'){
        fixedPlacesInfoInfo = realm.objects('fixed_places_info')
        .filtered('storPlacId == $0 AND fixPlacId == $1', WA1140Data.storPlacId, WA1140Data.fixPlacId)
        .sorted('useDt', true);
      }else{
        fixedPlacesInfoInfo = realm.objects('fixed_places_info')
        .filtered('storPlacId == $0 AND fixPlacId == $1 AND stySec == $2', WA1140Data.storPlacId, WA1140Data.fixPlacId, stySec)
        .sorted('useDt', true);
      }
      if(fixedPlacesInfoInfo.length > 0){
        setAreNo(fixedPlacesInfoInfo[0].areNo as string)//区域番号
        const options: PickerOption[] = fixedPlacesInfoInfo.map((item) => ({
          label: item.stySec as string, // 型アサーションを使用
          value: item.stySec as string  // 型アサーションを使用
        }));
        setStySecOptions(options);
      }
    };    
    //定置区画IDフォーカスイン
    const handleStySecFocus = () => {
      setIsStySecFocused(true);
    };
    //定置区画IDフォーカスアウト
    const handleStySecBlur = () => {
      if (isStySecFocused) {
        if(stySec===''){
          //区域番号をクリア
          setAreNo('')
          return;
        }
        const fixedPlacesInfoInfo = realm.objects('fixed_places_info')
        .filtered('storPlacId == $0 AND fixPlacId == $1 AND stySec == $2', WA1140Data.storPlacId, WA1140Data.fixPlacId, stySec)
        .sorted('useDt', true);
        if(fixedPlacesInfoInfo.length > 0){
          setAreNo(fixedPlacesInfoInfo[0].areNo as string)//区域番号
        }
        updateStySecOptions('2'); // 区域番号選択肢を更新
        setIsStySecFocused(false);
        isSend();
      }
    };
    //定置区画ID
    const makePickerStySec = () => {
      const fixedPlacesInfoInfo = realm.objects('fixed_places_info')
      .filtered('storPlacId == $0 AND fixPlacId == $1', WA1140Data.storPlacId, WA1140Data.fixPlacId)
      .sorted('useDt', true);
      if(fixedPlacesInfoInfo.length > 0){
        setStySec(fixedPlacesInfoInfo[0].stySec as string)//定置区画ID
      }
      return(
        <Picker
          selectedValue={selectStySec}
          onValueChange={(itemValue, itemIndex) => setSelectStySec(itemValue)}
          style={[styles.pickerStyle]}
        >
          {fixedPlacesInfoInfo.map((item) => (
            <Picker.Item key={item.stySec as string} label={`${item.stySec}`} value={item.stySec} />
          ))}
        </Picker>
      )        
    }
    //区域番号 フォーカスイン
    const handleAreNoFocus = () => {
      setIsAreNoFocused(true);
    };
    //区域番号 フォーカスアウト
    const handleAreNoBlur = () => {
      if (isAreNoFocused) {
        isSend();
      }
    }
    //区域番号    
    const makePickerAreNo = () => {
      const fixedPlacesInfoInfo = realm.objects('fixed_places_info')
      .filtered('storPlacId == $0 AND fixPlacId == $1', WA1140Data.storPlacId, WA1140Data.fixPlacId)
      .sorted('useDt', true);
      if(fixedPlacesInfoInfo.length > 0){
        setAreNo(fixedPlacesInfoInfo[0].areNo as string)//区域番号
      }
      return(
        <Picker
          selectedValue={selectAreNo}
          onValueChange={(itemValue, itemIndex) => setSelectAreNo(itemValue)}
          style={[styles.pickerStyle]}
        >
          {fixedPlacesInfoInfo.map((item) => (
            <Picker.Item key={item.areNo as string} label={`${item.areNo}`} value={item.areNo} />
          ))}
        </Picker>
      )      
    }
    //段数 フォーカスイン
    const handleNosFocus = () => {
      setIsNosFocused(true);
    };
    //段数 フォーカスアウト
    const handleNosBlur = () => {
      if (isNosFocused) {
        isSend();
      }
    }
    //段数
    const makePickerNos = () => {
      const settingsInfo = realm.objects('settings')[0]
      let maxNos = 0;
      switch(WA1140Data.rmSolTyp){
        case '1':
          maxNos = settingsInfo.selPlans as number;
          break;
        case '2':
          maxNos = settingsInfo.selCombust as number;
          break;
        case '3':
          maxNos = settingsInfo.selSoil as number;
          break;
        case '4':
          maxNos = settingsInfo.selConcrete as number;
          break;
        case '5':
          maxNos = settingsInfo.selAsphalt as number;
          break;
        case '6':
          maxNos = settingsInfo.selNoncombustMix as number;
          break;
        case '7':
          maxNos = settingsInfo.selAsbestos as number;
          break;
        case '8':
          maxNos = settingsInfo.selPlasterboard as number;
          break;
        case '9':
          maxNos = settingsInfo.selHazard as number;
          break;
        case '10':
          maxNos = settingsInfo.selOutCombust as number;
          break;
        case '11':
          maxNos = settingsInfo.selOutNoncombust as number;
          break;
        case '12':
          maxNos = settingsInfo.selTmpCombust as number;
          break;
        case '13':
          maxNos = settingsInfo.selTmpNoncombust as number;
          break;
        case '14':
          maxNos = settingsInfo.selAsh as number;
          break;
      }
      const numberItems = Array.from({ length: maxNos }, (_, index) => index + 1); // 1から始まる数値の配列を生成

      return(
        <Picker
          selectedValue={selectNos}
          onValueChange={(itemValue, itemIndex) => setSelectNos(itemValue)}
          style={[styles.pickerStyle]}
        >
          {numberItems.map((item) => (
            <Picker.Item key={item} label={`${item}`} value={item} />
          ))}
        </Picker>
      )
    };
    return (
      <View style={styles.container}>
        {/* ヘッダ */}
        <FunctionHeader appType={"現"} viewTitle={"定置場所入力"} functionTitle={"定置登録"}/>
    
        {/* 上段 */}
        <View  style={[styles.main]}>
          <Text style={[styles.labelText]}>作業場所：{WA1140Data.wkplcTyp}</Text>
          <Text style={[styles.labelText,styles.labelTextPlace]}>{WA1140Data.wkplc}</Text>
        </View>

        {/* 中段 */}
        <View  style={[styles.textareaContainer,styles.topContent]}>
          <View style={styles.tableMain}>
            <View style={styles.tableRow}>
              <View style={styles.tableCell}><Text style={[styles.labelText,styles.alignRight]}>新タグID：</Text></View>
              <View style={styles.tableCell}><Text style={styles.labelText}>{WA1140Data.newTagId}</Text></View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tableCell}><Text style={[styles.labelText,styles.alignRight]}>除去土壌等種別：</Text></View>
              <View style={styles.tableCell}><Text style={styles.labelText}>{CT0007[Number(WA1140Data?.rmSolTyp)]}</Text></View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tableCell}><Text style={[styles.labelText,styles.alignRight]}>定置区画ID：</Text></View>
              <View style={[styles.tableCell,styles.pickerFixStyle]}
                onStartShouldSetResponder={() => true}
                onResponderGrant={handleStySecFocus}
                onResponderRelease={handleStySecBlur}
              >
                {makePickerStySec()}
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tableCell}><Text style={[styles.labelText,styles.alignRight]}>区域番号：</Text></View>
              <View style={[styles.tableCell,styles.pickerFixStyle]}
                onStartShouldSetResponder={() => true}
                onResponderGrant={handleAreNoFocus}
                onResponderRelease={handleAreNoBlur}
              >
                <Picker
                  selectedValue={selectAreNo}
                  onValueChange={(itemValue, itemIndex) => setSelectAreNo(itemValue)}
                  style={[styles.pickerStyle]}
                >
                  {stySecOptions.map((item) => (
                    <Picker.Item key={item.value} label={item.label} value={item.value} />
                  ))}          
                </Picker>                
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tableCell}><Text style={[styles.labelText,styles.alignRight]}>段数：</Text></View>
              <View style={[styles.tableCell,styles.pickerFixStyle]}
                onStartShouldSetResponder={() => true}
                onResponderGrant={handleNosFocus}
                onResponderRelease={handleNosBlur}
              >              
                {makePickerNos()}
              </View>
            </View>
          </View>          
        </View>

        {/* 下段 */}
        <View style={[styles.bottomSection,styles.settingMain]}>
          <TouchableOpacity style={[styles.button, styles.settingButton,styles.settingButton3]} onPress={btnAppDestroy}>
            <Text style={styles.endButtonText}>破棄</Text>
          </TouchableOpacity>
          <TouchableOpacity 
           style={getButtonStyle()}
           disabled={isSendDisabled}           
           onPress={btnAppSend}>
            <Text style={[styles.endButtonText,styles.settingButtonText1]}>送信</Text>
          </TouchableOpacity>                    
        </View>

        {/* フッタ */}
        <Footer /> 


        {/* 処理中モーダル */}
        <ProcessingModal
          visible={modalVisible}
          message={messages.IA5018()}
          onClose={() => setModalVisible(false)}
        />

      </View>
    );
    
};
export default WA1141;