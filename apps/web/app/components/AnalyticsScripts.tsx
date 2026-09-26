import Script from "next/script";

export default function AnalyticsScripts() {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  return (
    <>
      {gaId ? (
        <>
          <Script
            src={"https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(gaId)}
            strategy="afterInteractive"
          />
          <Script
            dangerouslySetInnerHTML={{
              __html:
                "window.dataLayer=window.dataLayer||[];" +
                "function gtag(){dataLayer.push(arguments);}" +
                "window.gtag=gtag;" +
                "gtag('js',new Date());" +
                "gtag('config'," +
                JSON.stringify(gaId) +
                ",{anonymize_ip:true});",
            }}
            id="salonpro-ga4"
            strategy="afterInteractive"
          />
        </>
      ) : null}

      {metaPixelId ? (
        <Script
          dangerouslySetInnerHTML={{
            __html:
              "!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?" +
              "n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;" +
              "n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;" +
              "t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}" +
              "(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');" +
              "fbq('init'," +
              JSON.stringify(metaPixelId) +
              ");fbq('track','PageView');",
          }}
          id="salonpro-meta-pixel"
          strategy="afterInteractive"
        />
      ) : null}
    </>
  );
}
