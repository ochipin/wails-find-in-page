/** 検索クラス */
class Search {
    /** @type {HTMLDivElement} 検索ボックス本体 */
    #searchBox = document.querySelector("#search");

    /** @type {HTMLButtonElement} カスタマイズ用の設定画面を開くボタン */
    #openConfig = document.querySelector("#search-open-config");
    /** @type {HTMLElement} カスタマイズ用の設定画面 */
    #searchConfig = document.querySelector("#search-config");

    /** @type {HTMLInputElement} 検索用文字列を取り扱うinputエレメント */
    #searchInput = document.querySelector("#search-input");
    /** @type {HTMLElement} エラーメッセージ管理用エレメント */
    #errorMessage = document.querySelector("#search-error");

    /** @type {HTMLButtonElement} 大文字・小文字を区別するボタン */
    #matchCaseOption = document.querySelector("#search-match-case");
    /** @type {HTMLButtonElement} 正規表現検索を有効にするボタン */
    #regexpCaseOption = document.querySelector("#search-regexp-case");

    /** @type {HTMLDivElement} 検索結果を表示する場所を管理するエレメント */
    #searchResult = document.querySelector("#search-result");
    /** @type {HTMLSpanElement} 検索して見つかった、現在参照している場所を管理するエレメント */
    #searchNumber = document.querySelector("#search-result-number");
    /** @type {HTMLSpanElement} 検索して見つかった総件数を管理するエレメント */
    #totalCounter = document.querySelector("#search-result-total");

    /** @type {HTMLButtonElement} 前の項目へボタン */
    #searchPrevButton = document.querySelector("#search-prev");;
    /** @type {HTMLButtonElement} 次の項目へボタン */
    #searchNextButton = document.querySelector("#search-next");;
    /** @type {HTMLButtonElement} 検索画面閉じるボタン */
    #searchCloseButton = document.querySelector("#search-close");;

    /** @type {HTMLElement} 検索対象となるエレメント　*/
    #searchTarget;

    /** @type {string} 前回入力された検索文字列を保持する */
    #oldInput;
    /** @type {boolean} 前回指定された完全一致検索オプションを保持する */
    #oldMatchCase;
    /** @type {boolean} 前回指定された正規表現オプションを保持する*/
    #oldRegexpCase;
    /** @type {number} 検索対象となるカウンタ. 初期値は -1 */
    #searchCounter = -1;

    /** @type {Array<string>} 検索履歴 */
    #searchHistory = [];
    /** @type {number} 検索履歴の参照場所を覚えておく変数 */
    #historyNumber = 0;
    /** @type {HTMLElement} スクロールバーを所持するエレメント */
    #searchScrollElement;
    /** @type {HTMLElement} 検索した結果、どこの座標にあるのかを表示する場所 */
    #searchLandmark = document.querySelector("#search-landmark");
    /** @type {number} リサイズイベント用のタイマー */
    #timer = 0;

    /**
     * @param {Object} args
     * @param {HTMLElement} args.target 検索対象となるエレメント
     * @param {HTMLElement} args.scroll スクロールバーを所持するエレメント
     * @param {(ev: KeyboardEvent) => {}} args.shortcut ショートカットキー登録関数
     */
    constructor(args) {
        this.#searchTarget = args.target;
        this.#searchScrollElement = args.scroll;
        // 検索対象となるオブジェクトが分かるように印をつける
        this.#searchTarget.classList.add("__content-top");

        // 各エレメントに対して、イベントハンドラを登録する
        this.#attachEvent();
        // ショートカットキー登録関数
        const fn = args.shortcut || this.shortcut;
        this.shortcut = fn;
    }

    /**
     * @return 大文字・小文字検索が有効な場合はtrue。無効な場合はfalseを返却する。
    　*/
    isMatchCase() {
        return this.#matchCaseOption.classList.contains("active");
    }

    /**
     * @return 正規表現検索が有効な場合はtrue。無効な場合はfalseを返却する。
    　*/
    isRegexpCase() {
        return this.#regexpCaseOption.classList.contains("active");
    }

    /**
     * イベントハンドラを登録する
     */
    #attachEvent() {
        // キーが押された際に発火するイベント
        this.#searchInput.addEventListener("keydown",(ev) => {
            let historyNumber = 0;

            // 入力欄にフォーカスが当たっている際に、Enterキーが押下されたら検索を開始する
            if(ev.code === "Enter") {
                if(this.search()) {
                    // 検索が成功した場合、次の項目へカーソルを移動する
                    if(ev.shiftKey) {
                        // Shiftキーが押されている場合は、前の項目へカーソルを移動する
                        this.prevSearch();
                    } else {
                        // Enterキーのみが押されている場合は、次の項目へカーソルを移動する
                        this.nextSearch();
                    }
                }
            } else if(ev.code === "ArrowUp") {
                // 検索した履歴がない場合は、何もせず復帰する
                if(this.#searchHistory.length === 0) return;
                // 履歴参照箇所が、配列の要素数を超過している場合配列の最初を指すように調整する
                if(0 >= this.#historyNumber)
                    this.#historyNumber = 0;
                if(this.#searchInput.value != "")
                    this.#historyNumber++;
                // 検索履歴の参照場所を取得
                historyNumber = (this.#searchHistory.length-1) - this.#historyNumber;
                // 最後の検索履歴まで見た場合は何もせず復帰する
                if(historyNumber < 0) return;
                this.#searchInput.value = this.#searchHistory[historyNumber];
            } else if(ev.code === "ArrowDown") {
                // 検索した履歴がない場合は、何もせず復帰する
                if(this.#searchHistory.length === 0) return;
                // 履歴参照箇所が、配列の要素数を超過している場合配列の最後を指すように調整する
                if(this.#searchHistory.length <= this.#historyNumber)
                    this.#historyNumber = this.#searchHistory.length - 1;
                if(this.#searchInput.value != "")
                    this.#historyNumber--;
                // 検索履歴の参照場所を取得
                historyNumber = (this.#searchHistory.length-1) - this.#historyNumber;
                // 最後の検索履歴まで見た場合は何もせず復帰する
                if(historyNumber >= this.#searchHistory.length) return;
                this.#searchInput.value = this.#searchHistory[historyNumber];
            }
        });

        // 入力項目へフォーカスが当たった時に発火するイベント
        this.#searchInput.addEventListener("focus",() => {
            // フォーカスが当たっている時のみ、正規表現生成失敗などのエラーを表示する
            if(this.#errorMessage.classList.contains("open")) {
                this.#errorMessage.classList.remove("hide");
            }
            // 文字を選択する
            this.#searchInput.select();
        });

        // 入力項目のフォーカスが外れた時に発火するイベント
        this.#searchInput.addEventListener("blur",() => {
            // フォーカスが外れている時は、エラーメッセージは非表示にする
            if(this.#errorMessage.classList.contains("open")) {
                this.#errorMessage.classList.add("hide");
            }
        });

        // 大文字・小文字を区別するボタンが押下された時に発火するイベント
        this.#matchCaseOption.addEventListener("click", () => {
            // オプションの有効・無効を切り替える
            this.#matchCaseOption.classList.toggle("active");
            // 入力項目にフォーカスをあてる
            this.#searchInput.focus();
        });

        // 正規表現検索ボタンが押下された時に発火するイベント
        this.#regexpCaseOption.addEventListener("click", () => {
            // オプションの有効・無効を切り替える
            this.#regexpCaseOption.classList.toggle("active");
            // 入力項目にフォーカスをあてる
            this.#searchInput.focus();
        });

        // 前の項目へボタンが押下された際に発火するイベント
        this.#searchPrevButton.addEventListener("click",() => {
            // ボタンが押下された際に、検索をかける
            if(this.search()) {
                // 検索成功の場合は、目的の位置までスクロールする
                this.prevSearch();
            }
        });

        // 次の項目へボタンが押下された際に発火するイベント
        this.#searchNextButton.addEventListener("click",() => {
            // ボタンが押下された際に、検索をかける
            if(this.search()) {
                // 検索成功の場合は、目的の位置までスクロールする
                this.nextSearch();
            }
        });

        // 閉じるボタンが押下された際に発火するイベント
        this.#searchCloseButton.addEventListener("click",() => {
            // 検索ボックスを閉じ、ハイライトされている文字を解除する
            this.hide();
            this.clearHighlight();
        });

        // カスタマイズ用の設定画面を開くボタンが押された時のイベント
        this.#openConfig.addEventListener("click",() => {
            this.#searchBox.classList.toggle("open-config");
        });
    }

    /** 前の検索項目へ移動する */
    prevSearch() {
        // ハイライトがされているオブジェクトを取得する
        const elements = this.#searchTarget.querySelectorAll(".highlight");
        if(elements.length <= 0) {
            return;
        }
        const elmHighlight = [];
        for(let i=0; i<elements.length; i++) {
            elmHighlight[i] = elements[(elements.length-1)-i];
        }
        this.#moveSearch(elmHighlight);
        // 参照カウンタをセットする
        this.#searchNumber.textContent = (elements.length - this.#searchCounter);
    }

    /** 次の検索項目へ移動する */
    nextSearch() {
        // ハイライトがされているオブジェクトを取得する
        const elmHighlight = this.#searchTarget.querySelectorAll(".highlight");
        if(elmHighlight.length <= 0) {
            return;
        }
        this.#moveSearch(elmHighlight);
        // 参照カウンタをセットする
        this.#searchNumber.textContent = this.#searchCounter + 1;
    }

    /** 検索ボックスを開く */
    show() {
        if(!this.#searchBox.classList.contains("open"))
            this.#searchBox.classList.add("open");
        this.#searchInput.focus();
        // 検索ボックスを開くタイミングで、localStorageからアイテムを取り出す
        const serializedHistory = localStorage.getItem("searchHistory");
        this.#searchHistory = JSON.parse(serializedHistory) || [];
    }

    /** 検索ボックスを閉じる */
    hide() {
        if(this.#searchBox.classList.contains("open"))
            this.#searchBox.classList.remove("open");
        this.#searchInput.blur();
        // 検索ボックスを閉じるタイミングで、localStorageに検索履歴を保存する
        const serializedHistory = JSON.stringify(this.#searchHistory);
        localStorage.setItem("searchHistory", serializedHistory);
    }

    #moveSearch(elements) {
        // ハイライトされているオブジェクトで、ポインタが指し示している場所を探す
        for(let i=0; i<elements.length; i++) {
            if(elements[i].classList.contains("point")) {
                // ポインタが指し示す場所の、次を指すようにする
                this.#searchCounter = i+1;
                break;
            }
        }
        if(this.#searchCounter === -1 || this.#searchCounter >= elements.length) {
            // まだどこもポインタが指し示していない、もしくは最後尾まで検索が終わっている状態なら"0"に戻す
            elements[elements.length-1].classList.remove("point");
            this.#searchCounter = 0;
        } else {
            // 前の要素のポインタを削除する
            elements[this.#searchCounter-1].classList.remove("point");
        }
        // 対象となる検索ポイントまでスクロールする
        const clientRect = elements[this.#searchCounter].getBoundingClientRect();
        scrollTo(0, window.scrollY + clientRect.top);
        // 対象となる検索ポイントが分かるように印をつける
        elements[this.#searchCounter].classList.add("point");
    }

    /**
     * @param {string} message - 表示するエラーメッセージを指定する
     */
    #setErrorMessage(message) {
        this.#errorMessage.textContent = message;
        this.#errorMessage.classList.add("open");
    }

    /** エラーメッセージを閉じる */
    #closeErrorMessage() {
        this.#errorMessage.classList.remove("open");
    }

    /**
     * 検索件数をセットする
     * @return {number} ヒットした件数数を返却する
     */
    outputResult() {
        const elmHighlight = this.#searchTarget.querySelectorAll(".highlight");
        /** @type {number} 検索件数をカウントした数字 */
        const count = elmHighlight.length;
        if(count === 0) {
            // 検索結果がない場合は、ステータスを "none" にする
            this.#searchResult.classList.add("none");
            this.#searchResult.classList.remove("count");
        } else {
            // 検索結果がある場合は、ステータスを "count" にし、見つかった数をセットする
            this.#searchResult.classList.remove("none");
            this.#searchResult.classList.add("count");
            this.#totalCounter.textContent = count;
        }

        // 検索ポインタの表示場所をクリアする
        this.#searchLandmark.innerHTML = "";
        // ヒットした検索結果に対して、ポインタを付与する
        elmHighlight.forEach((element) => {
            this.setLandmark(element);
        });
        return count;
    }

    /**
     * 検索オプションに応じた、正規表現オブジェクトを生成する
     * @param {string} searchQuery 検索文字列
     * @return {RegExp} searchQueryから生成された正規表現オブジェクト
     */
    newRegExp(searchQuery) {
        // 正規表現が有効な場合は、特に\で置き換えないが、無効な場合は各種特殊文字は\で置き換える
        let rawQuery = this.isRegexpCase() ?
            searchQuery : searchQuery.replace(/([\(\)\.\+\*\?\$\^\|\[\]\{\}\\])/g, "\\$1");
        let regexp;
        try {
            if(this.isMatchCase()) {
                // 大文字・小文字区別する場合は、"g"を指定して区別するようにする
                regexp = new RegExp(rawQuery, "g");
            } else {
                // 大文字・小文字区別しない場合は、かなカナ両方にもマッチするようにする
                rawQuery = rawQuery.replace(/[\u3041-\u3096\u30a1-\u30f6]/g, (match) => {
                    if (/[\u3041-\u3096]/.test(match)) {
                        return `[${match}${String.fromCharCode(
                            match.charCodeAt(0) + 0x60
                        )}]`;
                    }
                    return `[${String.fromCharCode(
                        match.charCodeAt(0) - 0x60
                    )}${match}]`
                });
                regexp = new RegExp(rawQuery, "gi");
            }
        } catch(error) {
            // 正規表現オブジェクトに何らかのエラーが生じた場合、エラーメッセージに表示する
            this.#setErrorMessage(error.message);
            return false;
        }
        // 正規表現オブジェクトに不正な値が含まれていない場合はエラーメッセージを閉じる
        this.#closeErrorMessage();
        return regexp;
    }

    /** 前へ、次へボタンを押せるようにする */
    enableButtons() {
        this.#searchPrevButton.classList.remove("disabled");
        this.#searchNextButton.classList.remove("disabled");
    }

    /** 前へ、次へボタンを押せないようにする */
    disableButtons() {
        this.#searchPrevButton.classList.add("disabled");
        this.#searchNextButton.classList.add("disabled");
    }

    /** 検索履歴に検索した文字列を覚えさせる
     * @param {string} searchQuery 検索文字列
     */
    addHistory(searchQuery) {
        // 検索文字列を追加
        this.#searchHistory.push(searchQuery);
        // 検索履歴が、100件を超過したら101件目を削除する
        if(this.#searchHistory.length > 100) {
            this.#searchHistory.shift();
        }
    }

    /** ハイライトされているオブジェクト群を取得する
     * @return {NodeListOf<Element>}
     */
    getHighlight() {
        return this.#searchTarget.querySelectorAll(".highlight");
    }

    /**
     * 対象となる文字列を、ハイライトさせるための<span>タグへ置き換える
     * @param {RegExp} regexp - 正規表現オブジェクトを指定する
     * @param {string} targetText - 置き換え対象となる文字列を指定する
     * @return {string} - 起き変えた文字列
     */
    #setHighlight(regexp, targetText) {
        const entities = {
            "&amp;":  "&",
            "&gt;":   ">",
            "&lt;":   "<",
            "&nbsp;": " "
        };
        // エンティティ文字に対応させる
        targetText = targetText.toString().replace(/(&amp;|&gt;|&lt;|&nbsp;)/g, (partMatch) => {
            return entities[partMatch] || partMatch;
        });
        // 特に文字列を置き換える必要がない場合は何もせず復帰する
        if(!regexp.test(targetText)) {
            return targetText;
        }
        // 置き換える必要がある場合は、正規表現で置き換える
        return targetText.replace(regexp, (partMatch) => {
            if(partMatch.trim() == "") return partMatch;
            return `<span class="highlight">${partMatch}</span>`;
        });
    }

    /** ハイライトされている文字列をすべて解除する */
    clearHighlight() {
        // ハイライトがされているオブジェクトを取得する
        let elmHighlight = this.#searchTarget.querySelectorAll(".highlight");
        // ハイライトを一旦解除する
        [...elmHighlight].forEach((el) => {
            el.outerHTML = el.textContent;
        });
        // 過去検索文字列もクリアする
        this.#oldInput = "";
        this.#searchCounter = -1;
        this.#searchNumber.textContent = 1;
    }

    /**
     * 指定した文字を使用して、検索する
     * @return {boolean} 検索に成功した場合はtrue, 失敗した場合はfalseを返す
     */
    search() {
        // 入力された文字列を取得する
        const searchQuery = this.#searchInput.value;
        // 前回入力された値と同じ場合は、復帰する
        if((searchQuery == this.#oldInput) && (this.#oldMatchCase == this.isMatchCase()) && (this.#oldRegexpCase == this.isRegexpCase()) ) {
            if(searchQuery === "") {
                // 検索文字列が指定されていない場合は検索件数欄には何も出力せず復帰する
                this.#searchResult.classList.remove("none", "count");
                this.disableButtons();
                return false;
            }
            this.#closeErrorMessage();
            // true を返却することで復帰後、次の項目へスクロールする
            return true;
        }

        // 検索カウンタを初期化する
        this.#searchCounter = -1;
        // 検索開始前に、一旦ハイライトをすべて解除する
        this.clearHighlight();
        if(searchQuery === "") {
            // 検索文字列が指定されていない場合は検索件数欄には何も出力せず復帰する
            this.#searchResult.classList.remove("none", "count");
            this.disableButtons();
            return false;
        }

        // 指定された文字列から正規表現オブジェクトを生成する
        const regexp = this.newRegExp(searchQuery);
        // 正規表現オブジェクト生成失敗の場合は関数を復帰する
        if(regexp === false)
            return false;

        // 検索履歴に検索した文字列を覚えさせる
        this.addHistory(searchQuery);

        /** @type {string[]} */
        let elmResult = [];

        /**
         * 再帰的にDOMの中身1つ1つに対して検索をかけ、ハイライトしていく
         * @param {NodeListOf<ChildNode>} elements - 対象となる HTMLエレメントの "childNodes" を渡す
         * @param {HTMLElement} node - 対象となるHTMLエレメント. 一番初めの呼び出し時はNULLでよい
         */
        const highlight = (elements, node) => {
            elements.forEach(element => {
                // トリムした結果、文字列が空の場合は、何もせず復帰する
                if(element.textContent.trim() == "") return;
                if(element.nodeType == 1) {
                    // ノードタイプがエレメントの場合は、再帰的に配下のノードを参照する
                    if(node !== null) {
                        // 子ノードを参照する
                        const temp = element.cloneNode(false);
                        node.append(temp);
                        highlight(element.childNodes, temp);
                    } else {
                        // ノードがまだ作られていない場合は、作成する
                        node = element.cloneNode(false);
                        highlight(element.childNodes, node);
                        elmResult.push(node.outerHTML);
                        node = null;
                    }
                } else if(element.nodeType == 3) {
                    // テキストノードの場合は、ハイライト処理を実施する
                    node.innerHTML += this.#setHighlight(regexp, element.textContent);
                }
            });
        }

        // ハイライトを付ける
        let result = "";
        [...this.#searchTarget.children].forEach((elements) => {
            const parent = elements.cloneNode(false);
            highlight(elements.childNodes, null);
            parent.innerHTML = elmResult.join("");
            result += parent.outerHTML;
            elmResult = [];
        });
        // ハイライトを付与したDOM構成を"join"して、再表示する
        this.#searchTarget.innerHTML = result;
        // 検索件数をセットする. 検索数に応じて、前へ、次へボタンの有効・無効を切り替える
        this.outputResult() == 0 ? this.disableButtons() : this.enableButtons();
        // 検索された文字列や、検索オプションを覚えておく
        this.#oldInput = searchQuery;
        this.#oldMatchCase = this.isMatchCase();
        this.#oldRegexpCase = this.isRegexpCase();

        return true
    }

    /** すべての検索結果を表示している目印をクリアする */
    clearLandmarks() {
        this.#searchLandmark.innerHTML = "";
    }

    /** 目印をセットする
     * @param {HTMLElement} element
     */
    setLandmark(element) {
        // 検索結果を表示する、目印の高さを取得する (※この領域を100%の表示場所として扱う)
        const searchPointHeight = this.#searchLandmark.clientHeight;
        // コンテンツ全体の高さを取得する
        const contentsHeight = this.#searchScrollElement.scrollHeight;
        // 検索対象となる、オブジェクトの高さを取得する
        const objectHeight = (element.getBoundingClientRect().bottom - element.getBoundingClientRect().top) / 2;
        // オブジェクトの座標を、スクロールされた位置を考慮して取得する
        const objectPoint = this.#searchScrollElement.scrollTop + element.getBoundingClientRect().top + objectHeight;
        // 「オブジェクトの座標 / コンテンツの高さ * 目印の高さ」 で目印の座標を算出する
        let point = objectPoint / contentsHeight * searchPointHeight;
        if(searchPointHeight > contentsHeight) {
            // スクロールするだけの高さが、コンテンツにないときは、スクロールされた位置を考慮しない
            point = objectPoint;
        }
        // 目印をセットする
        const landmark = document.createElement("div");
        landmark.classList.add("search-points");
        landmark.style.top = point + "px";
        this.#searchLandmark.append(landmark);
    }

    /** リサイズイベント用関数 */
    resize() {
        if(this.#timer > 0)
            clearTimeout(this.#timer);
        this.#timer = setTimeout(() => {
            // 検索ポインタを初期化する
            this.clearLandmarks();
            // 検索ポインタを付与する
            this.getHighlight().forEach((element) => {
                this.setLandmark(element);
            });
        }, 200);
    }

    /** ショートカットキーを登録する関数
     * @param {KeyboardEvent} ev キー入力用イベント
     */
    shortcut(ev) {
        if(ev.ctrlKey && ev.code == 'KeyF') {
            // Ctrl + F キーで検索ボックスを表示する
            this.show();
            ev.preventDefault();
        } else if(ev.code == 'Escape') {
            // Escape キーで検索ボックスを閉じる
            this.hide();
            this.clearHighlight();
            ev.preventDefault();
        }
    }
}
