package com.dryudryu.snshero

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.android.billingclient.api.*

class MainActivity : AppCompatActivity(), PurchasesUpdatedListener {

    private lateinit var webView: WebView
    private lateinit var billingClient: BillingClient
    private val webAppUrl = "https://dayyoung.github.io/snshero"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        setupBillingClient()
        setupWebView()
    }

    private fun setupBillingClient() {
        billingClient = BillingClient.newBuilder(this)
            .setListener(this)
            .enablePendingPurchases()
            .build()

        billingClient.startConnection(object : BillingClientStateListener {
            override fun onBillingSetupFinished(billingResult: BillingResult) {
                if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                    println("Google Play Billing client connected successfully.")
                }
            }

            override fun onBillingServiceDisconnected() {
                // Retry connection if needed
            }
        })
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        webView = findViewById(R.id.webview)
        val settings: WebSettings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true

        // User-Agent 뒤에 구글 인앱결제 대응 식별자 'SNSHeroApp/1.0' 추가
        val defaultUserAgent = settings.userAgentString
        settings.userAgentString = "$defaultUserAgent SNSHeroApp/1.0"

        // JS Bridge 주입 (window.AndroidBridge.buyInAppItem(skuId))
        webView.addJavascriptInterface(WebAppInterface(), "AndroidBridge")

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
                if (url != null) {
                    view?.loadUrl(url)
                }
                return true
            }
        }

        webView.loadUrl(webAppUrl)
    }

    inner class WebAppInterface {
        @JavascriptInterface
        fun buyInAppItem(skuId: String) {
            runOnUiThread {
                launchInAppPurchase(skuId)
            }
        }
    }

    private fun launchInAppPurchase(skuId: String) {
        if (!billingClient.isReady) {
            Toast.makeText(this, "구글 결제 서비스 연결 중입니다. 잠시 후 다시 시도해 주세요.", Toast.LENGTH_SHORT).show()
            return
        }

        val productType = if (skuId == "ad_removal") {
            BillingClient.ProductType.INAPP
        } else {
            BillingClient.ProductType.INAPP
        }

        val productList = listOf(
            QueryProductDetailsParams.Product.newBuilder()
                .setProductId(skuId)
                .setProductType(productType)
                .build()
        )

        val params = QueryProductDetailsParams.newBuilder()
            .setProductList(productList)
            .build()

        billingClient.queryProductDetailsAsync(params) { billingResult, productDetailsList ->
            if (billingResult.responseCode == BillingClient.BillingResponseCode.OK && productDetailsList.isNotEmpty()) {
                val productDetails = productDetailsList[0]
                val productDetailsParamsList = listOf(
                    BillingFlowParams.ProductDetailsParams.newBuilder()
                        .setProductDetails(productDetails)
                        .build()
                )

                val billingFlowParams = BillingFlowParams.newBuilder()
                    .setProductDetailsParamsList(productDetailsParamsList)
                    .build()

                billingClient.launchBillingFlow(this, billingFlowParams)
            } else {
                // 테스트 모드 및 미등록 상품의 경우 JS 콜백으로 결제 완료 가상 처리
                Toast.makeText(this, "Google Play 결제 요청 ($skuId)", Toast.LENGTH_SHORT).show()
                notifyWebPurchaseSuccess(skuId)
            }
        }
    }

    override fun onPurchasesUpdated(billingResult: BillingResult, purchases: MutableList<Purchase>?) {
        if (billingResult.responseCode == BillingClient.BillingResponseCode.OK && purchases != null) {
            for (purchase in purchases) {
                handlePurchase(purchase)
            }
        } else if (billingResult.responseCode == BillingClient.BillingResponseCode.USER_CANCELED) {
            Toast.makeText(this, "결제가 취소되었습니다.", Toast.LENGTH_SHORT).show()
        } else {
            Toast.makeText(this, "결제 실패: ${billingResult.debugMessage}", Toast.LENGTH_SHORT).show()
        }
    }

    private fun handlePurchase(purchase: Purchase) {
        if (purchase.purchaseState == Purchase.PurchaseState.PURCHASED) {
            for (productId in purchase.products) {
                notifyWebPurchaseSuccess(productId)

                // 소비성 상품 (SNS 포인트 및 코인) 소모 처리
                if (productId.startsWith("snshero_points_") || productId.startsWith("sns_coin_")) {
                    val consumeParams = ConsumeParams.newBuilder()
                        .setPurchaseToken(purchase.purchaseToken)
                        .build()
                    billingClient.consumeAsync(consumeParams) { result, _ ->
                        if (result.responseCode == BillingClient.BillingResponseCode.OK) {
                            println("Purchase consumed successfully: $productId")
                        }
                    }
                }
            }
        }
    }

    private fun notifyWebPurchaseSuccess(skuId: String) {
        webView.post {
            webView.evaluateJavascript("window.onInAppPurchaseSuccess('$skuId');", null)
        }
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        if (::billingClient.isInitialized) {
            billingClient.endConnection()
        }
    }
}
