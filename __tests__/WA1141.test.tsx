/**-------------------------------------------
 * WA1141 テスト
 * screens/WA1141.tsx
 * ---------------------------------------------*/
import React, { useEffect } from 'react';
import {
    render,
    fireEvent,
} from '@testing-library/react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootList } from '../src/navigation/AppNavigator';
import {
    RecoilRoot,
} from 'recoil';
import { Text, View } from 'react-native';
import { act } from '@testing-library/react-native';
import WA1141 from '../src/screens/WA1141';
import { getInstance } from '../src/utils/Realm';
import { IFT0140 } from '../src/utils/Api';
import { WA1140DataState } from '../src/atom/atom';


const mockNavigate = jest.fn();
// navigationオブジェクトのモック
const mockNavigation = {
    navigate: mockNavigate,
} as unknown as StackNavigationProp<RootList, 'WA1141'>; // 型アサーション

// 外部でデータを定義
let mockScanData: string;
let mockSelectdata: string;
let mockQRScan: (onScan: (data: string, type: string) => void) => void;
let mockSelect: (onSelect: (item: string) => void) => void;
let mockLoginData: any;
let mockApiPromise: any;
let mockWA1140DataState: any;

/************************************************
 * モック
 ************************************************/
// QRScannerのモック
jest.mock('../src/utils/QRScanner', () => {
    return {
        __esModule: true,
        default: jest.fn().mockImplementation(({ onScan }) => {
            // モックされたQRScannerがレンダリングされた後、自動的にonScanを呼び出す
            useEffect(() => {
                mockQRScan(onScan);
            }, [onScan]);

            // 実際のカメラUIの代わりにダミーの要素を表示
            return (
                <View>
                    <Text>QRScannerモック</Text>
                </View>
            );
        }),
    };
});

// CustomDropDownInputのモック
jest.mock('../src/components/CustomDropDownInput', () => {
    return {
        __esModule: true,
        default: jest.fn().mockImplementation(({ onSelect }) => {
            // モックされたQRScannerがレンダリングされた後、自動的にonScanを呼び出す
            useEffect(() => {
                mockSelect(onSelect);
            }, [onSelect]);

            // 実際のカメラUIの代わりにダミーの要素を表示
            return (
                <View>
                    <Text>Selectモック</Text>
                </View>
            );
        }),
    };
});

// Realmのモック
jest.mock('../src/utils/Realm', () => {
    const mockCreate = jest.fn();
    return {
        getInstance: jest.fn().mockReturnValue({
            objects: jest.fn().mockImplementation(function (schema: string) {
                if (schema === 'login') {
                    return [mockLoginData];
                } else if (schema === 'temporary_places') {
                    return [
                        {
                            id: '72b9feea-de53-47ea-b00c-dbda5d8ca53c',
                            tmpPlacId: '2987023', //場所ID
                            tmpPlacNm: '大阪', //名前
                        },
                    ];
                } else if (schema === 'storage_places') {
                    return [
                        {
                            id: '72b9feea-de53-47ea-b00c-dbda5d8ca53c',
                            storPlacId: '2987023', //場所ID
                            storPlacNm: '大阪', //名前
                        },
                    ];
                } else if (schema === 'fixed_places_info') {
                    return {
                        filtered: jest.fn().mockImplementation(() => ({
                            sorted: jest.fn().mockImplementation(() => {
                                return [
                                    {
                                        id: '72b9feea-de53-47ea-b00c-dbda5d8ca53c',
                                        useDt: new Date(),
                                        storPlacId: '2987023',
                                        fixPlacId: '096383',
                                        stySec: '123',
                                        areNo: 123,
                                    },
                                ];
                            }),
                        })),
                    };
                } else if (schema === 'settings') {
                    return [{
                        selPlans: '1',
                    }];
                }
            }),
            write: jest.fn(callback => {
                callback(mockCreate);
            }),
            create: mockCreate,
        }),
    };
});

// AlertContextのモック
const mockShowAlert = jest.fn(() => Promise.resolve(true));
jest.mock('../src/components/AlertContext', () => ({
    useAlert: () => ({
        showAlert: mockShowAlert,
        // 他の必要な関数やプロパティがあればここに追加
    }),
}));

// Apiのモック
jest.mock('../src/utils/Api', () => ({
    IFT0140: jest.fn(async () => mockApiPromise),
}));

// react-native-fsのモック
jest.mock('react-native-fs', () => ({
    // 他のモック関数とともに追加
    stat: jest.fn(() =>
        Promise.resolve({
            // stat 関数が返すべき適切なオブジェクトをモックします
            // 以下は例です。必要に応じて調整してください
            size: 1024,
            isFile: () => true,
            isDirectory: () => false,
            mtime: new Date(),
            ctime: new Date(),
            // その他の必要なプロパティ
        }),
    ),
    exists: jest.fn(() => Promise.resolve(true)),
    appendFile: jest.fn(() => Promise.resolve()),
    readDir: jest.fn(() => Promise.resolve([])),
    // その他必要なメソッドをモック
}));

// react-native-aes-cryptoのモック
jest.mock('react-native-aes-crypto', () => ({
    randomUuid: jest.fn(() => Promise.resolve('12344')),
}));

// RNCameraをモック
jest.mock('react-native-camera', () => ({
    RNCamera: {
        Constants: {
            BarCodeType: {
                qr: 'QR',
            },
        },
    },
}));

/************************************************
 * テストコード
 ************************************************/
describe('WA1141 Screen', () => {
    afterEach(() => {
        jest.useRealTimers();
    });

    beforeEach(() => {
        jest.useFakeTimers();

        // 共通タグID
        mockScanData = 'CM,a929091111111111a';
        mockQRScan = (onScan: (data: string, type: string) => void) => {
            onScan(mockScanData, 'QR');
        };
        mockSelectdata = '123';
        mockSelect = (onSelect: (item: string) => void) => {
            onSelect(mockSelectdata);
        };
    });


    //　初期表示設定
    it('成功 ', async () => {
        mockWA1140DataState = {
            storPlacId: '2987023',
            fixPlacId: '096383',
            stySec: '123',
            areNo: 123,
            wkplcTyp: '',
            wkplc: '',
            newTagId: '',
            rmSolTyp: '',
            nos: '',
        };
        const { getByTestId } = render(
            <RecoilRoot
                initializeState={(snap: any) => {
                    snap.set(WA1140DataState, mockWA1140DataState);
                }}
            >
                <WA1141 navigation={mockNavigation} />
            </RecoilRoot>,
        );

        const pickerView = getByTestId('picker-table');
        await act(async () => {
            fireEvent(pickerView, 'startShouldSetResponder', undefined);
        });


    });

    // 破棄ボタン処理
    it('成功 破棄ボタン処理 ', async () => {
        const { getByText } = render(
            <RecoilRoot>
                <WA1141 navigation={mockNavigation} />
            </RecoilRoot>,
        );

        const triggerButton = getByText(/破棄/);
        await act(async () => {
            fireEvent.press(triggerButton);
        });
    });

    // 定置区画ID選択
    it('成功 定置区画ID選択 ', async () => {
        const { getAllByText } = render(
            <RecoilRoot>
                <WA1141 navigation={mockNavigation} />
            </RecoilRoot>,
        );
        const dropdownInput = await getAllByText('Selectモック')[0];

        await act(async () => {
            fireEvent(dropdownInput, 'select');
            jest.advanceTimersByTime(10005);
        });

        const dropdownInput1 = await getAllByText('Selectモック')[1];

        await act(async () => {
            fireEvent(dropdownInput1, 'select');
            jest.advanceTimersByTime(10005);
        });
    });

    //定置区画IDフォーカスアウト
    it('成功 定置区画IDフォーカスアウト ', async () => {
        mockSelectdata = '';
        mockSelect = (onSelect: (item: string) => void) => {
            onSelect(mockSelectdata);
        };
        const { getAllByText } = render(
            <RecoilRoot>
                <WA1141 navigation={mockNavigation} />
            </RecoilRoot>,
        );
        const dropdownInput = await getAllByText('Selectモック')[0];

        await act(async () => {
            fireEvent(dropdownInput, 'blur');
            jest.advanceTimersByTime(10005);
        });
    });

    // タグの読み取り、新タグIDが未登録の場合、アラート表示
    it('失敗 定置区画IDフォーカスアウト ', async () => {
        mockSelectdata = '123';
        mockSelect = (onSelect: (item: string) => void) => {
            onSelect(mockSelectdata);
        };
        const { getAllByText } = render(
            <RecoilRoot>
                <WA1141 navigation={mockNavigation} />
            </RecoilRoot>,
        );
        const dropdownInput = await getAllByText('Selectモック')[0];

        await act(async () => {
            fireEvent(dropdownInput, 'blur');
            jest.advanceTimersByTime(10005);
        });
    });

    // 送信ボタン処理
    it('成功 送信ボタン処理 tempList:0 ', async () => {
        mockSelectdata = '123';
        mockSelect = (onSelect: (item: string) => void) => {
            onSelect(mockSelectdata);
        };
        (IFT0140 as jest.Mock)
            .mockImplementationOnce(() => ({
                success: true,
                data: {
                    itcRstCd: 1,
                    dtl: [{}],
                },
            }));
        mockWA1140DataState = {
            storPlacId: '2987023',
            fixPlacId: '096383',
            stySec: '123',
            areNo: 12,
            wkplcTyp: '',
            wkplc: '',
            newTagId: '',
            rmSolTyp: '1',
            nos: '',
        };
        (getInstance as jest.Mock).mockReturnValue({
            objects: jest.fn().mockImplementation(function (schema: string) {
                if (schema === 'login') {
                    return [mockLoginData];
                } else if (schema === 'temporary_places') {
                    return [
                        {
                            id: '72b9feea-de53-47ea-b00c-dbda5d8ca53c',
                            tmpPlacId: '2987023', //場所ID
                            tmpPlacNm: '大阪', //名前
                        },
                    ];
                } else if (schema === 'storage_places') {
                    return [
                        {
                            id: '72b9feea-de53-47ea-b00c-dbda5d8ca53c',
                            storPlacId: '2987023', //場所ID
                            storPlacNm: '大阪', //名前
                        },
                    ];
                } else if (schema === 'fixed_places_info') {
                    return {
                        filtered: jest.fn().mockImplementation(() => ({
                            sorted: jest.fn().mockImplementation(() => {
                                return [
                                    // sorted data
                                ];
                            }),
                        })),
                    };
                } else if (schema === 'settings') {
                    return [
                        {
                            selPlans: '1',
                        },
                    ];
                }
            }),
            write: jest.fn(callback => {
                callback();
            }),
            create: jest.fn(),
        });
        const { getByTestId, getAllByText, getByText } = render(
            <RecoilRoot
                initializeState={(snap: any) => {
                    snap.set(WA1140DataState, mockWA1140DataState);
                }}
            >
                <WA1141 navigation={mockNavigation} />
            </RecoilRoot>,
        );
        const triggerButton = getByTestId('picker');
        await act(async () => {
            fireEvent(triggerButton, 'onValueChange', '123', 1);
            jest.advanceTimersByTime(10005);
        });
        const dropdownInput = await getAllByText('Selectモック')[0];

        await act(async () => {
            fireEvent(dropdownInput, 'select');
            jest.advanceTimersByTime(10005);
        });
        const dropdownInput1 = await getAllByText('Selectモック')[1];

        await act(async () => {
            fireEvent(dropdownInput1, 'select');
            jest.advanceTimersByTime(10005);
        });

        const triggerButton1 = getByText(/送信/);
        await act(async () => {
            fireEvent.press(triggerButton1);
        });
    });

    // API通信処理エラー有無確認・エラーハンドリング
    it('成功 API通信処理エラー有無確認・エラーハンドリング', async () => {
        mockSelectdata = '123';
        mockSelect = (onSelect: (item: string) => void) => {
            onSelect(mockSelectdata);
        };
        (IFT0140 as jest.Mock)
            .mockImplementationOnce(() => ({
                success: true,
            }));
        const { getByTestId, getByText, getAllByText } = render(
            <RecoilRoot>
                <WA1141 navigation={mockNavigation} />
            </RecoilRoot>,
        );
        const triggerButton = getByTestId('picker');
        await act(async () => {
            fireEvent(triggerButton, 'onValueChange', '123', 1);
            jest.advanceTimersByTime(10005);
        });
        const dropdownInput = await getAllByText('Selectモック')[0];

        await act(async () => {
            fireEvent(dropdownInput, 'select');
            jest.advanceTimersByTime(10005);
        });
        const dropdownInput1 = await getAllByText('Selectモック')[1];

        await act(async () => {
            fireEvent(dropdownInput1, 'select');
            jest.advanceTimersByTime(10005);
        });

        const triggerButton1 = getByText(/送信/);
        await act(async () => {
            fireEvent.press(triggerButton1);
        });
    });

    it('失敗 タグの読み、新タグIDが未登録の場合、アラート表示(codeHttp200)', async () => {
        (IFT0140 as jest.Mock)
            .mockResolvedValue({
                success: false,
                error: 'codeHttp200',
            });
        const { getByTestId, getByText, getAllByText } = render(
            <RecoilRoot>
                <WA1141 navigation={mockNavigation} />
            </RecoilRoot>,
        );
        const triggerButton = getByTestId('picker');
        await act(async () => {
            fireEvent(triggerButton, 'onValueChange', '123', 1);
            jest.advanceTimersByTime(10005);
        });
        const dropdownInput = await getAllByText('Selectモック')[0];

        await act(async () => {
            fireEvent(dropdownInput, 'select');
            jest.advanceTimersByTime(10005);
        });
        const dropdownInput1 = await getAllByText('Selectモック')[1];

        await act(async () => {
            fireEvent(dropdownInput1, 'select');
            jest.advanceTimersByTime(10005);
        });

        const triggerButton1 = getByText(/送信/);
        await act(async () => {
            fireEvent.press(triggerButton1);
        });
    });

    it('失敗 タグの読み、新タグIDが未登録の場合、アラート表示 (codeHttp200)', async () => {
        (IFT0140 as jest.Mock)
            .mockResolvedValue({
                success: false,
                error: 'codeHttp200',
            });
        const { getByTestId, getByText, getAllByText } = render(
            <RecoilRoot>
                <WA1141 navigation={mockNavigation} />
            </RecoilRoot>,
        );
        const triggerButton = getByTestId('picker');
        await act(async () => {
            fireEvent(triggerButton, 'onValueChange', '123', 1);
            jest.advanceTimersByTime(10005);
        });
        const dropdownInput = await getAllByText('Selectモック')[0];

        await act(async () => {
            fireEvent(dropdownInput, 'select');
            jest.advanceTimersByTime(10005);
        });
        const dropdownInput1 = await getAllByText('Selectモック')[1];

        await act(async () => {
            fireEvent(dropdownInput1, 'select');
            jest.advanceTimersByTime(10005);
        });

        const triggerButton1 = getByText(/送信/);
        await act(async () => {
            fireEvent.press(triggerButton1);
        });
    });

    it('失敗 タグの読み、新タグIDが未登録の場合、アラート表示(codeRsps01)', async () => {
        (IFT0140 as jest.Mock)
            .mockResolvedValue({
                success: false,
                error: 'codeRsps01',
            });
        const { getByTestId, getByText, getAllByText } = render(
            <RecoilRoot>
                <WA1141 navigation={mockNavigation} />
            </RecoilRoot>,
        );
        const triggerButton = getByTestId('picker');
        await act(async () => {
            fireEvent(triggerButton, 'onValueChange', '123', 1);
            jest.advanceTimersByTime(10005);
        });
        const dropdownInput = await getAllByText('Selectモック')[0];

        await act(async () => {
            fireEvent(dropdownInput, 'select');
            jest.advanceTimersByTime(10005);
        });
        const dropdownInput1 = await getAllByText('Selectモック')[1];

        await act(async () => {
            fireEvent(dropdownInput1, 'select');
            jest.advanceTimersByTime(10005);
        });

        const triggerButton1 = getByText(/送信/);
        await act(async () => {
            fireEvent.press(triggerButton1);
        });
    });

    it('失敗 タグの読み、新タグIDが未登録の場合、アラート表示(timeout) ', async () => {
        (IFT0140 as jest.Mock)
            .mockResolvedValue({
                success: false,
                error: 'timeout',
            });
        const { getByTestId, getByText, getAllByText } = render(
            <RecoilRoot>
                <WA1141 navigation={mockNavigation} />
            </RecoilRoot>,
        );
        const triggerButton = getByTestId('picker');
        await act(async () => {
            fireEvent(triggerButton, 'onValueChange', '123', 1);
            jest.advanceTimersByTime(10005);
        });
        const dropdownInput = await getAllByText('Selectモック')[0];

        await act(async () => {
            fireEvent(dropdownInput, 'select');
            jest.advanceTimersByTime(10005);
        });
        const dropdownInput1 = await getAllByText('Selectモック')[1];

        await act(async () => {
            fireEvent(dropdownInput1, 'select');
            jest.advanceTimersByTime(10005);
        });

        const triggerButton1 = getByText(/送信/);
        await act(async () => {
            fireEvent.press(triggerButton1);
        });
    });

    // 送信ボタン処理
    it('成功 送信ボタン処理 tempList:0', async () => {
        mockSelectdata = '123';
        mockSelect = (onSelect: (item: string) => void) => {
            onSelect(mockSelectdata);
        };
        (IFT0140 as jest.Mock)
            .mockResolvedValue({
                success: true,
                data: {},
            });
        mockWA1140DataState = {
            storPlacId: '2987023',
            fixPlacId: '096383',
            stySec: '123',
            areNo: 12,
            wkplcTyp: '',
            wkplc: '',
            newTagId: '',
            rmSolTyp: '0',
            nos: '',
        };
        (getInstance as jest.Mock).mockReturnValue({
            objects: jest.fn().mockImplementation(function (schema: string) {
                if (schema === 'login') {
                    return [mockLoginData];
                } else if (schema === 'temporary_places') {
                    return [
                        {
                            id: '72b9feea-de53-47ea-b00c-dbda5d8ca53c',
                            tmpPlacId: '2987023', //場所ID
                            tmpPlacNm: '大阪', //名前
                        },
                    ];
                } else if (schema === 'storage_places') {
                    return [
                        {
                            id: '72b9feea-de53-47ea-b00c-dbda5d8ca53c',
                            storPlacId: '2987023', //場所ID
                            storPlacNm: '大阪', //名前
                        },
                    ];
                } else if (schema === 'fixed_places_info') {
                    return {
                        filtered: jest.fn().mockImplementation(() => ({
                            sorted: jest.fn().mockImplementation(() => {
                                return [
                                    {
                                        id: '72b9feea-de53-47ea-b00c-dbda5d8ca53c',
                                        useDt: new Date(),
                                        storPlacId: '2987023',
                                        fixPlacId: '096383',
                                        stySec: '123',
                                        areNo: 123,
                                    },
                                ];
                            }),
                        })),
                    };
                } else if (schema === 'settings') {
                    return [
                        {
                            selPlans: '1',
                        },
                    ];
                }
            }),
            write: jest.fn(callback => {
                callback();
            }),
            create: jest.fn(),
        });
        const { getByTestId, getAllByText, getByText } = render(
            <RecoilRoot
                initializeState={(snap: any) => {
                    snap.set(WA1140DataState, mockWA1140DataState);
                }}
            >
                <WA1141 navigation={mockNavigation} />
            </RecoilRoot>,
        );
        const triggerButton = getByTestId('picker');
        await act(async () => {
            fireEvent(triggerButton, 'onValueChange', '123', 1);
            jest.advanceTimersByTime(10005);
        });
        const dropdownInput = await getAllByText('Selectモック')[0];

        await act(async () => {
            fireEvent(dropdownInput, 'select');
            jest.advanceTimersByTime(10005);
        });
        const dropdownInput1 = await getAllByText('Selectモック')[1];

        await act(async () => {
            fireEvent(dropdownInput1, 'select');
            jest.advanceTimersByTime(10005);
        });

        const triggerButton1 = getByText(/送信/);
        await act(async () => {
            fireEvent.press(triggerButton1);
        });
    });
});