import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ 
  title, 
  description, 
  canonical, 
  keywords, 
  image, 
  url, 
  type = 'website', 
  robots = 'index, follow',
  schemaMarkup
}) => {
  const siteTitle = title ? `${title} | Zorix School` : 'Zorix School';
  
  return (
    <Helmet>
      {/* Basic HTML Meta Tags */}
      <title>{siteTitle}</title>
      {description && <meta name="description" content={description} />}
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="author" content="Zorix School" />
      <meta name="robots" content={robots} />
      {canonical && <link rel="canonical" href={canonical} />}
      <meta name="theme-color" content="#ffffff" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={siteTitle} />
      {description && <meta property="og:description" content={description} />}
      {image && <meta property="og:image" content={image} />}
      {url && <meta property="og:url" content={url} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={siteTitle} />
      {description && <meta name="twitter:description" content={description} />}
      {image && <meta name="twitter:image" content={image} />}

      {/* Schema Markup (JSON-LD) */}
      {schemaMarkup && (
        <script type="application/ld+json">
          {JSON.stringify(schemaMarkup)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
