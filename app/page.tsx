const products = [
  { icon: 'GRAD', title: 'استند حروف GRAD', publicPrice: '۹۹۹', basuPrice: '۷۹۹', tone: 'mint' },
  { icon: '۱۴۰۰', title: 'استند اعداد ۱۴۰۰', publicPrice: '۹۹۹', basuPrice: '۷۹۹', tone: 'sun' },
  { icon: '✿', title: 'دسته‌گل', publicPrice: '۲۹۹', basuPrice: '۱۹۹', tone: 'rose' },
];

export default function Home() {
  return (
    <main dir="rtl">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="باسو، صفحه اصلی">
          <span className="brand-mark" aria-hidden="true">ب</span>
          <span>باسو</span>
        </a>
        <nav className="main-nav" aria-label="پیمایش اصلی">
          <a href="#equipment">تجهیزات</a>
          <a href="#how">روش رزرو</a>
          <a href="#support">پشتیبانی</a>
        </nav>
        <a className="header-action" href="#reserve">پیگیری رزرو</a>
      </header>

      <section id="top" className="hero-shell">
        <div className="hero-copy">
          <span className="eyebrow"><i /> رزرو ساده برای روزهای مهم</span>
          <h1>تجهیزات مراسمت،<br /><em>سرِ وقت</em> و بی‌دردسر.</h1>
          <p>
            از لباس فارغ‌التحصیلی تا استند و دسته‌گل؛ موجودی واقعی را ببین،
            قیمتت را همان لحظه حساب کن و همه‌چیز را یک‌جا رزرو کن.
          </p>
          <div className="hero-proof">
            <div><strong>۲ دقیقه</strong><span>تا ثبت درخواست</span></div>
            <div><strong>قیمت شفاف</strong><span>آزاد و بوعلی</span></div>
            <div><strong>تحویل هماهنگ</strong><span>با یادآوری هوشمند</span></div>
          </div>
        </div>

        <form id="reserve" className="booking-card">
          <div className="booking-head">
            <div>
              <span>شروع رزرو</span>
              <h2>چه چیزی لازم داری؟</h2>
            </div>
            <span className="availability"><i /> موجودی زنده</span>
          </div>
          <label>
            <span>تجهیزات</span>
            <select defaultValue="gown">
              <option value="gown">لباس فارغ‌التحصیلی</option>
              <option value="grad">استند حروف GRAD</option>
              <option value="1400">استند اعداد ۱۴۰۰</option>
              <option value="bouquet">دسته‌گل</option>
              <option value="easel">سه‌پایه بوم</option>
            </select>
          </label>
          <div className="form-grid">
            <label><span>تاریخ مراسم</span><input type="date" aria-label="تاریخ مراسم" /></label>
            <label><span>تعداد</span><input type="number" min="1" max="30" defaultValue="1" /></label>
          </div>
          <fieldset className="price-type">
            <legend>نوع قیمت</legend>
            <label><input type="radio" name="price" defaultChecked /> <span><b>دانشگاه بوعلی</b><small>با احراز دانشجویی</small></span></label>
            <label><input type="radio" name="price" /> <span><b>آزاد</b><small>برای همه</small></span></label>
          </fieldset>
          <button type="button">بررسی موجودی و قیمت <span aria-hidden="true">←</span></button>
          <p className="secure-note">ثبت درخواست رایگان است؛ پرداخت پس از تأیید موجودی انجام می‌شود.</p>
        </form>
      </section>

      <section id="equipment" className="equipment-section">
        <div className="section-heading">
          <div><span>پیشنهادهای محبوب</span><h2>هر چیزی برای یک قاب ماندگار</h2></div>
          <a href="#reserve">مشاهده همه تجهیزات <span>←</span></a>
        </div>
        <div className="product-grid">
          {products.map((product) => (
            <article className="product-card" key={product.title}>
              <div className={`product-art ${product.tone}`}><span>{product.icon}</span></div>
              <div className="product-info">
                <h3>{product.title}</h3>
                <div className="prices">
                  <span><small>قیمت بوعلی</small><strong>{product.basuPrice}</strong><i>هزار تومان</i></span>
                  <span><small>قیمت آزاد</small><b>{product.publicPrice}</b><i>هزار تومان</i></span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
