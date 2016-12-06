/**
 * Userinsightのランキングを取得、表示
 * ＊UserinsightAPIの仕様により、月またぎをする場合、前月PV、当月PVを別に取得する。
 * 2016/08/9 yokanull
 */
$(function userinsightRankDisp() {
    //userinsight情報
    var group_id = "***"; //userinsightのID
    var api_key = "******"; //userinsightのAPIキー    
    var limit = "220"; //総取得件数
    var categoryTag = "cat01";
    //ランキング広告枠設定
    var adFlg = 0; //0=off 1=on
    var adPosition = 3; //１〜９の間で設定する offの場合は0にしておくこと
    var adRankTitle = "広告枠１";
    var adUrl = "広告URL";
    var adImgUrl = "広告画像URL"; //横100pxまで

    //出力数
    var rankNum = 10 - parseInt(adFlg); 
    
    var now = new Date();
    var ny = now.getFullYear();

    //昨日
    var pre = new Date(ny, now.getMonth(), now.getDate() - 1);
    var py = pre.getFullYear();
    var pm = ("0" + (pre.getMonth() + 1)).slice(-2);
    var pd = ("0" + pre.getDate()).slice(-2);
    
    //window.alert(py+pm+pd);
    
    //テスト用
    //py =2016;
    //pm =09;
    //pd =03;
    
    var yesterday = py + "-" + pm + "-" + pd;

    //一週間前
    var xday = new Date();
    var x = -7;
    xday.setDate(now.getDate() + x);

    var xy = xday.getFullYear();
    var xm = ("0" + (xday.getMonth() + 1)).slice(-2);
    var xd = ("0" + xday.getDate()).slice(-2);

    //テスト用
    xy =py;
    xm =pm;
    xd =pd;    
    
    var oneWeekBeforeDay = xy + "-" + xm + "-" + xd;
    var resultList = [];
    var deleteUrlList = [];
    var rTitle ="";
    
    document.getElementById("startDay").innerHTML = oneWeekBeforeDay;
    document.getElementById("endDay").innerHTML = yesterday;  
    
    //月またぎ判定（UserinsightAPIでは、月またぎのURLランキングを取得できない2016/8/2）
    //var monthOverNum = xm - pm;
    if (xm !== pm) {
        window.alert("matagi");
        //月またぎ処理
        //当月１日〜昨日までのランキングを取得
        endMonthFirstDay = py + "-" + pm + "-01";
        var endMonthRankList = [];

        var thisSendurl = 'https://ux-api.userlocal.jp/api/data';

        $.ajax({
            type: 'get',
            url: thisSendurl,
            crossDomain: true,
            dataType: 'json',
            data: {
                data_type: 'url_ranking',
                group_id: group_id,
                api_key: api_key,
                limit: limit,
                start_date: endMonthFirstDay,
                end_date: yesterday,
            },

            success: function (resp) {
                var dataLength = resp.data.length;
                if (dataLength < 1) {
                    //データ取得失敗
                    return false;
                } else {

                    //データがある場合
                    var obj = resp.data;
                    var entries = [];
                    for (var i = 0; i < dataLength; i++) {
                        entries[i] = {
                            subject: obj[i]['subject'],
                            url: obj[i]['url'],
                            pv: obj[i]['pv']
                        };
                    }
                    endMonthRankList = entries;
                }
            }
        });

        //一週間前の日付〜同月末までのランキングを取得
        var endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        var ed = ("0" + endDate.getDate()).slice(-2);
            
        var startMonthEndDay = xy + "-" + xm + "-" + ed;
        var startMonthRankList = [];

        var bfSendurl = 'https://ux-api.userlocal.jp/api/data';

        $.ajax({
            type: 'get',
            url: bfSendurl,
            crossDomain: true,
            dataType: 'json',
            data: {
                data_type: 'url_ranking',
                group_id: group_id,
                api_key: api_key,
                limit: limit,
                start_date: oneWeekBeforeDay,
                end_date: startMonthEndDay,
            },
            
            success: function (resp) {
                var dataLength = resp.data.length;
                if (dataLength < 1) {
                    //データ取得失敗
                    return false;
                } else {

                    //データがある場合
                    var obj = resp.data;
                    var entries = [];
                    for (var i = 0; i < dataLength; i++) {
                        entries[i] = {
                            subject: obj[i]['subject'],
                            url: obj[i]['url'],
                            pv: obj[i]['pv']
                        };
                    }
                    startMonthRankList = entries;

                    //startMonthRankListとendMonthRankListを一つのリストにつめる
                    var endMonthRankListLength = endMonthRankList.length;
                    var startMonthRankListLength = startMonthRankList.length;
                    resultList = endMonthRankList;

                    //前月リストの追加
                    for (var i = 0; i < startMonthRankListLength; i++) {
                        var sumi = parseInt(endMonthRankListLength) + parseInt(i) /* +1 */ ;
                        resultList[sumi] = startMonthRankList[i];
                    }

                    //重複データ削除 tab区切りの場合があるのでurlではなくタイトルで判断
                    var arrObj = {};
                    for (var i = 0; i < resultList.length; i++) {
                        arrObj[resultList[i]['subject']] = resultList[i];
                    }
                    resultList = [];

                    for (var key in arrObj) {
                        resultList.push(arrObj[key]);
                    }

                    //ソートDESC
                    object_array_sort(resultList, 'pv', 'desc', function (new_data) {
                        //ソート後の処理

                    });

                    var includeFlg; 

                    //出力
                    //集計範囲の日付を出力
                    document.getElementById("startDay").innerHTML = oneWeekBeforeDay;
                    document.getElementById("endDay").innerHTML = yesterday;                    
                    
                    //ランキング本体出力
                    for (var i = 0; i < resultList.length; i++) {
                        j = parseInt(i) + 1;

                        //除外するurlを設定
                        if (resultList[i].url === "https://yahoo.co.jp/") {
                            resultList.splice(i,1);
                        }
                        
                        //除外するタイトルを設定
                        var includeFlg = resultList[i].subject.indexOf("トップページ");
                        if (includeFlg > -1) {
                            //設定した文字列をタイトルから削除
                            // 文字列の最後の6文字を削除する
                            resultList[i].subject = resultList[i].subject.substr(0, resultList[i].subject.length - 6);
                        }

                        document.getElementById("rank-" + j).innerHTML = '<label><span>' + j + '</span></label><span><a href="' + resultList[i].url + '" target="_blank">' + resultList[i].subject + '</a></span>';
                    }
                }
            }
        });

    } else {
        //通常処理
        
        //ランキング全体取得
        function func01(){
            //window.alert("func01 start");
            var dfd = $.Deferred();
            var normalSendurl = 'https://ux-api.userlocal.jp/api/data';
            $.ajax({
                type: 'get',
                url: normalSendurl,
                crossDomain: true,
                dataType: 'json',
                //async: false,

                data: {
                    data_type: 'url_ranking',
                    group_id: group_id,
                    api_key: api_key,
                    limit: limit,
                    start_date: oneWeekBeforeDay,
                    end_date: yesterday,
                },
            }).done(function(resp){
                    var obj = resp.data;
                    var entries = [];
                    var dataLength = resp.data.length;                
                    for (var i = 0; i < dataLength; i++) {
                        entries[i] = {
                            subject: obj[i]['subject'],
                            url: obj[i]['url'],
                            pv: obj[i]['pv']
                        };
                    }
                    resultList = entries;

                    //重複データ削除 tab区切りの場合があるのでurlではなくタイトルで判断
                    var arrObj = {};
                    for (var i = 0; i < resultList.length; i++) {
                        arrObj[resultList[i]['subject']] = resultList[i];
                    }
                    resultList = [];

                    for (var key in arrObj) {
                        resultList.push(arrObj[key]);
                    }

                    //ソートDESC
                    object_array_sort(resultList, 'pv', 'desc', function (new_data) {
                        //ソート後の処理
                        //console.log(new_data); //
                    });
                
                console.log('ajax finish');
                //ajax処理を終了したことをDeferredオブジェクトに通知
                dfd.resolve();
            });
            //完了を知らせるためにDeferredオブジェクトを生成しそれを返す
            return dfd.promise();
		}
        
        //ogp titleを取得し、undefinedのものを削除
        function func02(){
            //表示対象選別
            var dfd = $.Deferred();
            //非同期でループする為、iとは別にカウントする
            
            for (var i = resultList.length - 1; i >= 0; i--) {
                //ループ中にarrayの要素数が減少するためループを末尾から処理（カウントダウンで回す）
                //商品が無くなっている可能性があるため、リストからではなくogpから確認する
                                
                //削除処理
                if (resultList[i].url.indexOf("shop") < 0 || resultList[i].url.indexOf("DS") < 0 || resultList[i].url.indexOf(categoryTag) < 0 || resultList[i].subject.indexOf("ページを表示できません。") > -1 || rTitle === undefined) {
                    resultList.splice(i,1);
                }else{
                    //削除対象でない
                    
                }
                

            }
            dfd.resolve();
            return dfd.promise();
		}
        
        //undefinedのものをリスト化
        function func04(){
            //window.alert("func04 start");
            var dfd = $.Deferred();       
            var loopCntFlg = 0;
            var preResLength = resultList.length -1;
            
            for (var i = resultList.length - 1; i >= 0; i--) {
                (function(i){
                    $.ajax({
                        type: 'GET',
                        url: resultList[i].url,
                        dataType: 'html',
                        crossDomain: true,                        
                        success: function(data) {
                            //ogp title取得 
                            rTitle = $(data.responseText).filter("meta[property='og:title']").attr('content');
                            
                            //削除処理
                            if (rTitle === undefined) {
                                deleteUrlList.push(resultList[i].url);
                            }else{
                                //削除対象でない
                            }
                        }
                    }).fail(function(data){                    

                    }).always(function(data){
                        //ループフラグ更新
                        loopCntFlg++;                        
                        //全てループが終了したらresolve()する
                        if(loopCntFlg > preResLength){
                           dfd.resolve();
                        }
                    });
                })(i);    
            }
            return dfd.promise();
        }
        
        //deleteUrlListと一致するものを削除
        function func05(){
            var dfd = $.Deferred();              
            for (var i = 0; i < deleteUrlList.length; i++) {
                for (var j = 0; j < resultList.length; j++) {           
                    if(deleteUrlList[i] === resultList[j].url){
                       resultList.splice(j,1);
                    }
                }
            }
            dfd.resolve();
            return dfd.promise();            
        }        
        
        //出力処理
        function func03(){
            var dfd = $.Deferred();                
            for (var i = 0; i < resultList.length; i++) {
                var j = parseInt(i) + 1;

                var includeFlg = resultList[i].subject.indexOf("タイトル");
                if (includeFlg > -1) {
                    //「タイトル】」という文字列をタイトルから削除
                    // 文字列の最後の11文字を削除する
                    resultList[i].subject = resultList[i].subject.substr(0, resultList[i].subject.length - 11);
                }
                
                //画像出力（非同期）
                var deferred = new $.Deferred();
                if(j < rankNum + 1){
                    deferred = getOGP(resultList[i].url,j,adFlg,adPosition);                    
                }
                

                //ランキング本体出力                
                if(i < rankNum){
                    //広告枠調整
                    if(adFlg > 0 && j > adPosition-1){ //adposision=2
                        //広告枠表示
                        if(j === adPosition){
                            //広告枠
                            document.getElementById("rank-" + j).innerHTML = '<label><span>' + j + '</span></label><span><a href="' + adUrl + '" target="_blank">' + adRankTitle + '</a></span>';
                            
                            //OGP画像位置の画像もここで設定する
                            document.getElementById("rankImg-" + j).innerHTML = '<span>' + adRankTitle + '<br><img src="'+ adImgUrl +'" style="width:100px;" /></span><br>';
                            
                            //広告枠の次の枠
                            var l = j + 1;
                            document.getElementById("rank-" + l).innerHTML = '<label><span>' + l + '</span></label><span><a href="' + resultList[i].url + '" target="_blank">' + resultList[i].subject + '</a></span>';
                                                        
                        }else{
                            //以降の順位をずらす
                            var k = j+1;
                            document.getElementById("rank-" + k).innerHTML = '<label><span>' + k + '</span></label><span><a href="' + resultList[i].url + '" target="_blank">' + resultList[i].subject + '</a></span>';                            
                        }

                    }else{
                        //通常出力
                        document.getElementById("rank-" + j).innerHTML = '<label><span>' + j + '</span></label><span><a href="' + resultList[i].url + '" target="_blank">' + resultList[i].subject + '</a></span>';
                    }
                        document.body.style.overflow="auto";                      
                }
                dfd.resolve();  
            }
            return dfd.promise();
		}
        
        //同期制御
        func01().then(func02).then(func04).then(func05).then(func03);
			
    }
});


//OGP取得
function getOGP(urlStr,j,adFlg,adPosition) {
    var titleStr ="";//title
    var productImg ="";//image
    var d = $.Deferred();
    $.ajax({
        type: 'get',
        url: urlStr,
        dataType: 'html',
        success: function(data) {
         titleStr = $(data.responseText).filter("meta[property='og:title']").attr('content');            
         productImg = $(data.responseText).filter("meta[property='og:image']").attr('content');
    }
    }).fail(function(){

    }).always(function(){
        console.log('ajax finish');
        if(adFlg > 0 && j > adPosition -1){
            if(j === adPosition){
                //広告枠をとばす
                var k = j+1;
                document.getElementById("rankImg-" + k).innerHTML = '<span>' + titleStr + '<br><img src="'+ productImg +'" style="width:100px;" /></span><br>';   
            }else{
                //以降の順位をずらす
                var l = j+1;
                document.getElementById("rankImg-" + l).innerHTML = '<span>' + titleStr + '<br><img src="'+ productImg +'" style="width:100px;" /></span><br>';             
            }
                    
        }else{
            document.getElementById("rankImg-" + j).innerHTML = '<span>' + titleStr + '<br><img src="'+ productImg +'" style="width:100px;" /></span><br>';            
        }
        
        d.resolve();
    });
    return d.promise();
}



/**
 * オブジェクトをソートする
 **/
function object_array_sort(data, key, order, fn) {
    //デフォは降順(DESC)
    var num_a = -1;
    var num_b = 1;

    if (order === 'asc') { //指定があれば昇順(ASC)
        num_a = 1;
        num_b = -1;
    }

    data = data.sort(function (a, b) {
        var x = a[key];
        var y = b[key];
        if (x > y) return num_a;
        if (x < y) return num_b;
        return 0;
    });

    fn(data); // ソート後の配列を返す
}


/**
 * objectのプロパティ数を返す
 **/
function getPropertyNum(obj) {
    var len = 0;

    for (var key in obj) {
        ++len;
    }

    return len;
}