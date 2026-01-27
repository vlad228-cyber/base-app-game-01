export default function Head() {
  const baseAppId = process.env.NEXT_PUBLIC_BASE_APP_ID;

  return (
    <>
      {baseAppId ? <meta name="base:app_id" content={baseAppId} /> : null}
    </>
  );
}
