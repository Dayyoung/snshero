
    (function() {
      var preconnectOrigins = ["https://cdn.shopify.com"];
      var scripts = ["/cdn/shopifycloud/checkout-web/assets/c1/polyfills.Db3KX98s.js","/cdn/shopifycloud/checkout-web/assets/c1/app.BEC4uZJN.js","/cdn/shopifycloud/checkout-web/assets/c1/esnext-vendor.5raVCjZP.js","/cdn/shopifycloud/checkout-web/assets/c1/context-browser.PearK32K.js","/cdn/shopifycloud/checkout-web/assets/c1/checkout-policy.Cw_L5JiM.js","/cdn/shopifycloud/checkout-web/assets/c1/receipt-mapper-load-recovery.BCE0J3mo.js","/cdn/shopifycloud/checkout-web/assets/c1/receipt-eager-mappers.ollIi3cv.js","/cdn/shopifycloud/checkout-web/assets/c1/helpers-setAddressErrors.CAKlW0ek.js","/cdn/shopifycloud/checkout-web/assets/c1/types-ShopPayInstallments.DOoTuMwd.js","/cdn/shopifycloud/checkout-web/assets/c1/sections-shared.BF6RAeFi.js","/cdn/shopifycloud/checkout-web/assets/c1/consent-manager-shared.BpiY6haN.js","/cdn/shopifycloud/checkout-web/assets/c1/error-logger-report-graphql-error.DYo_4Eje.js","/cdn/shopifycloud/checkout-web/assets/c1/cvv-cvvBridge.DMY16beA.js","/cdn/shopifycloud/checkout-web/assets/c1/shop-pay-normalizeBuyerDetails.CXFbOU6_.js","/cdn/shopifycloud/checkout-web/assets/c1/utilities-shopCashMoney.CL6s4gom.js","/cdn/shopifycloud/checkout-web/assets/c1/color-contrast-colorContrast.BTflSDZM.js","/cdn/shopifycloud/checkout-web/assets/c1/graphql-redeemable.C6EBVdkJ.js","/cdn/shopifycloud/checkout-web/assets/c1/hydrate.D5uXyuBQ.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useShopPayExternalAppContext.DFZIa5Ss.js","/cdn/shopifycloud/checkout-web/assets/c1/locale-ko.Dc66ZJPl.js","/cdn/shopifycloud/checkout-web/assets/c1/OnePage.Bqz4vQmv.js","/cdn/shopifycloud/checkout-web/assets/c1/components-DeliveryTransition.DZvov-He.js","/cdn/shopifycloud/checkout-web/assets/c1/useShopPayButtonClassName.DGbRwl_2.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useSuppressShopPayModalOnLoad.DLm6Nr-1.js","/cdn/shopifycloud/checkout-web/assets/c1/cross-border-hooks.EHnygPQW.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-usePickupPoints.BbaChwud.js","/cdn/shopifycloud/checkout-web/assets/c1/ChangeCompanyLocationLink.DRm-VgIG.js","/cdn/shopifycloud/checkout-web/assets/c1/BillingAddressForm.CvBpBJSM.js","/cdn/shopifycloud/checkout-web/assets/c1/PhoneField.jZD7rjjy.js","/cdn/shopifycloud/checkout-web/assets/c1/ImpressionEventCapture.Bus5VNGp.js","/cdn/shopifycloud/checkout-web/assets/c1/components-RedirectionNotice.module.Bjw8IIru.js","/cdn/shopifycloud/checkout-web/assets/c1/Choice.DX3xaalg.js","/cdn/shopifycloud/checkout-web/assets/c1/Checkbox.CV_Ymgoi.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useCanChangeCompanyLocation.BmHw7Dlo.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useForceShopPayUrl.uqY2Y7XA.js","/cdn/shopifycloud/checkout-web/assets/c1/CaptureEvents-ButtonWithRegisterWebPixel.DMX-yS3I.js","/cdn/shopifycloud/checkout-web/assets/c1/ShopPayLogo.D7Z4bo_6.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useWalletsTimeout.rARb8sqp.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-usePostPurchase.DfArUZM5.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useWalletsMonorailTrack.Buz-DBEU.js","/cdn/shopifycloud/checkout-web/assets/c1/IncentiveBadge.BRorM2z4.js","/cdn/shopifycloud/checkout-web/assets/c1/AutocompleteField-hooks.u5tFIGO3.js","/cdn/shopifycloud/checkout-web/assets/c1/PendingShipping.CRvlMw4f.js","/cdn/shopifycloud/checkout-web/assets/c1/useAddressMutationsWithNegotiation.CvhVRwJD.js","/cdn/shopifycloud/checkout-web/assets/c1/PaymentIcon.D-m2yEc6.js","/cdn/shopifycloud/checkout-web/assets/c1/PaymentLine.BQqeLLU5.js","/cdn/shopifycloud/checkout-web/assets/c1/Theme-ThemeOverride.BI7e8Stz.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useUpdateCheckoutAddress.BOeR3VIb.js","/cdn/shopifycloud/checkout-web/assets/c1/payment-usePaymentExemptionReason.BgFF3s0h.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useShopPayProgressIntercepts.CE8YF4Gb.js","/cdn/shopifycloud/checkout-web/assets/c1/Section.DaCOvqR6.js","/cdn/shopifycloud/checkout-web/assets/c1/Section-SectionStyleOverride.BlIBxFPx.js","/cdn/shopifycloud/checkout-web/assets/c1/utilities-previous.BzXgLfr9.js","/cdn/shopifycloud/checkout-web/assets/c1/PaymentErrorBanner.GZZVE8wM.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useGeneralPaymentErrorMessage.CHUVVbmJ.js","/cdn/shopifycloud/checkout-web/assets/c1/StickyPayButton-StickyPayButton.module.BycKo0k-.js","/cdn/shopifycloud/checkout-web/assets/c1/PayButton-helpers.4YeNrYX0.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-payment-button.BzKFSa9s.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-usePreselectSpi.CYgXVpho.js","/cdn/shopifycloud/checkout-web/assets/c1/Switch.BO_-Rrz1.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useAvailableShopPromotionDiscounts.hR6QuCSw.js","/cdn/shopifycloud/checkout-web/assets/c1/checkout-as-guest-amazon-pay.BAqurg_Y.js","/cdn/shopifycloud/checkout-web/assets/c1/Middot.BAV_R_Rd.js","/cdn/shopifycloud/checkout-web/assets/c1/EstimatedDeliveryContent.fwV52GZ5.js","/cdn/shopifycloud/checkout-web/assets/c1/ShippingMethodRateLabel.C4_QZtoG.js","/cdn/shopifycloud/checkout-web/assets/c1/shipping-methods-consolidated-included.B7Q-m2qv.js","/cdn/shopifycloud/checkout-web/assets/c1/ShippingLines.mnICK9BX.js","/cdn/shopifycloud/checkout-web/assets/c1/ShipmentBreakdown.DYG7SI4-.js","/cdn/shopifycloud/checkout-web/assets/c1/MerchandiseModal.CUS6qx15.js","/cdn/shopifycloud/checkout-web/assets/c1/ShippingMethodSelector.ctrsa8m1.js","/cdn/shopifycloud/checkout-web/assets/c1/TextArea.DrRPJZzF.js","/cdn/shopifycloud/checkout-web/assets/c1/SubscriptionPriceBreakdown.BiVq1Zwg.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useShopPayNewSignupLoginExperiment.LMtL3taE.js","/cdn/shopifycloud/checkout-web/assets/c1/StockProblems-StockProblemsLineItemList.BCvJ3w2T.js"];
      var styles = ["/cdn/shopifycloud/checkout-web/assets/c1/assets/app.C61fwjfC.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/checkout-policy.CdXX_CXd.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/helpers.BNEoUX98.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/OnePage.D7x7thWB.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/DeliveryTransition.CxmS455s.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/useAddressMutationsWithNegotiation.DPEapfiO.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/Section.CU18S7Ap.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/PaymentLine.D3bcP-mr.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/previous.B_iZlQze.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/StickyPayButton.3WRao8Y9.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/PaymentIcon.gzvCNwz_.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/useShopPayProgressIntercepts.CIy8uDiZ.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/Choice.CP8QNAbt.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/IncentiveBadge.Dlnp55te.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/BillingAddressForm.BdwN7V1K.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/Switch.Dq_6Ius6.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/useShopPayButtonClassName.CpHF4L7Q.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/PhoneField.uZEuHncj.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/Middot.D7Ujmshx.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/ShippingLines.LcqrKXE1.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/MerchandiseModal.D6OuIVjc.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/EstimatedDeliveryContent.B_THySFF.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/RedirectionNotice.B8v_QGNW.css"];
      var fontPreconnectUrls = [];
      var fontPrefetchUrls = [];
      var imgPrefetchUrls = [];

      function preconnect(url, callback) {
        var link = document.createElement('link');
        link.rel = 'dns-prefetch preconnect';
        link.href = url;
        link.crossOrigin = '';
        link.onload = link.onerror = callback;
        document.head.appendChild(link);
      }

      function preconnectAssets() {
        var resources = preconnectOrigins.concat(fontPreconnectUrls);
        var index = 0;
        (function next() {
          var res = resources[index++];
          if (res) preconnect(res, next);
        })();
      }

      function prefetch(url, as, callback) {
        var link = document.createElement('link');
        if (link.relList.supports('prefetch')) {
          link.rel = 'prefetch';
          link.fetchPriority = 'low';
          link.as = as;
          if (as === 'font') link.type = 'font/woff2';
          link.href = url;
          link.crossOrigin = '';
          link.onload = link.onerror = callback;
          document.head.appendChild(link);
        } else {
          var xhr = new XMLHttpRequest();
          xhr.open('GET', url, true);
          xhr.onloadend = callback;
          xhr.send();
        }
      }

      function prefetchAssets() {
        var resources = [].concat(
          scripts.map(function(url) { return [url, 'script']; }),
          styles.map(function(url) { return [url, 'style']; }),
          fontPrefetchUrls.map(function(url) { return [url, 'font']; }),
          imgPrefetchUrls.map(function(url) { return [url, 'image']; })
        );
        var index = 0;
        function run() {
          var res = resources[index++];
          if (res) prefetch(res[0], res[1], next);
        }
        var next = (self.requestIdleCallback || setTimeout).bind(self, run);
        next();
      }

      function onLoaded() {
        try {
          if (parseFloat(navigator.connection.effectiveType) > 2 && !navigator.connection.saveData) {
            preconnectAssets();
            prefetchAssets();
          }
        } catch (e) {}
      }

      if (document.readyState === 'complete') {
        onLoaded();
      } else {
        addEventListener('load', onLoaded);
      }
    })();
  