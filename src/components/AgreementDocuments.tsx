import React from 'react';

/**
 * 《用户服务协议》与《隐私政策》全文内容。
 * 界面风格与应用深色主题保持一致：卡片 bg-neutral-900、正文 text-neutral-300、
 * 强调色 #4BA3A8。两份文档同时用于启动同意弹窗与设置页查看。
 */

const H2: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="text-base font-bold text-neutral-100 mt-7 mb-3 pb-2 border-b border-neutral-800">
    {children}
  </h2>
);

const P: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <p className={`text-[13px] leading-relaxed text-neutral-300 mb-3 ${className}`}>{children}</p>
);

const LI: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <li className="text-[13px] leading-relaxed text-neutral-300 mb-2.5 pl-1">{children}</li>
);

export const PrivacyPolicyContent: React.FC = () => (
  <div>
    <h1 className="text-xl font-bold text-[#4BA3A8] text-center mb-1.5">隐私政策</h1>
    <p className="text-center text-[12px] text-neutral-500 mb-5">
      <strong>生效日期</strong>：2026年09月09日
    </p>

    <div className="bg-[#4BA3A8]/10 border border-[#4BA3A8]/25 border-l-4 border-l-[#4BA3A8] rounded-xl p-4 mb-5">
      <p className="text-[13px] leading-relaxed text-neutral-200">
        欢迎使用「意序填色」（以下简称“本应用”）。本应用由
        <strong className="text-neutral-100">光年跃迁（温州）科技有限公司</strong>
        （以下简称“我们”）开发并运营。我们深知个人信息对您的重要性，将严格遵守《中华人民共和国个人信息保护法》等相关法律法规，保护您的个人信息安全。
      </p>
    </div>

    <P>
      本隐私政策旨在说明我们如何收集、使用、存储和保护您在使用本应用过程中产生的信息，以及您对这些信息所享有的权利。请您在使用本应用前仔细阅读并充分理解本政策的全部内容，尤其是加粗的条款。如您对本政策有任何疑问、意见或建议，可通过本政策末尾提供的联系方式与我们联系。
    </P>

    <H2>一、我们收集的信息</H2>
    <P>本应用是一款离线优先的填色创作工具，<strong className="text-neutral-100">不注册账号、不接入服务器、不含任何第三方统计或广告 SDK</strong>。在您使用本应用的过程中：</P>
    <ol className="list-decimal pl-5 mb-4">
      <LI>
        <strong className="text-neutral-100">创作数据</strong>：您的填色作品、涂色笔触记录、回放数据、收藏颜色，以及您主动导入用于提取线稿的图片，
        <strong className="text-neutral-100">全部仅保存在您设备的本地存储中</strong>，我们不会上传、收集、备份或查看这些数据。
      </LI>
      <LI>
        <strong className="text-neutral-100">相册与媒体权限</strong>：当您主动使用「从相册导入图片提取线稿」或「导出/保存作品到相册」功能时，应用会在您的授权下访问设备相册或媒体存储。
        相关图片<strong className="text-neutral-100">仅在您的设备本地处理与保存，不会上传至任何服务器</strong>；您不使用上述功能时，应用不会访问您的相册。
      </LI>
      <LI>
        <strong className="text-neutral-100">设备信息</strong>：本应用不收集设备型号、操作系统版本、设备标识符（如 IMEI / Android ID）、IP 地址等个人信息，也不进行用户画像或行为追踪。
      </LI>
    </ol>

    <H2>二、我们如何使用收集的信息</H2>
    <P>我们仅在以下合法、正当、必要的范围内处理相关信息：</P>
    <ol className="list-decimal pl-5 mb-4">
      <LI>
        <strong className="text-neutral-100">提供核心功能</strong>：本地创作数据用于实现点触填色、多笔触绘画、对称镜像、过程回放、作品保存与导出等功能，所有处理均在您的设备端完成。
      </LI>
      <LI>
        <strong className="text-neutral-100">改善体验</strong>：您的音效、触感、默认画笔等偏好设置仅存储在本地，用于在下次打开时恢复您的使用习惯。
      </LI>
    </ol>

    <H2>三、我们如何共享、转让和公开披露信息</H2>
    <P>我们郑重承诺，严格保护您的个人信息：</P>
    <ol className="list-decimal pl-5 mb-4">
      <LI>本应用<strong className="text-neutral-100">不接入任何第三方 SDK 类服务商</strong>，不存在与第三方共享数据的情形。</LI>
      <LI>
        <strong className="text-neutral-100">法定情形</strong>：根据法律法规的规定，或行政、司法机关的强制性要求，我们可能会被要求配合披露相关信息。
      </LI>
      <LI>
        <strong className="text-neutral-100">获得明确同意</strong>：除上述情形外，任何共享、转让或公开披露均会事先获得您的明确同意。
      </LI>
    </ol>

    <H2>四、我们如何存储和保护信息</H2>
    <ol className="list-decimal pl-5 mb-4">
      <LI>
        <strong className="text-neutral-100">存储地点和期限</strong>：您的创作数据与设置存储于您设备的本地存储（应用私有数据目录）中，
        <strong className="text-neutral-100">不会离开您的设备</strong>。数据将一直保留至您主动删除作品、使用「清理缓存」功能或卸载本应用，届时相关数据将被彻底清除且无法恢复。
      </LI>
      <LI>
        <strong className="text-neutral-100">安全措施</strong>：数据不经过网络传输，从根本上避免了传输环节的泄露风险。建议您通过应用内「导出数据备份」功能定期备份重要作品，并妥善保管您的设备。
      </LI>
    </ol>

    <H2>五、您的权利</H2>
    <P>根据相关法律法规，您对您的个人信息享有以下权利，且均可在应用内直接行使：</P>
    <ol className="list-decimal pl-5 mb-4">
      <LI><strong className="text-neutral-100">访问权</strong>：您可以随时在作品集与编辑器中查看全部作品和创作过程。</LI>
      <LI><strong className="text-neutral-100">更正权</strong>：您可以随时继续编辑、修改或撤销任意作品中的内容。</LI>
      <LI><strong className="text-neutral-100">删除权</strong>：您可以删除单个作品，或通过「清理缓存」一键清除全部作品与数据。</LI>
      <LI><strong className="text-neutral-100">数据导出</strong>：您可以将作品导出为图片保存到相册，或通过「导出数据备份」导出标准 JSON 文件迁移至其他设备。</LI>
    </ol>

    <H2>六、未成年人保护</H2>
    <P>
      我们非常重视对未成年人个人信息的保护。如您是未满 14 周岁的未成年人，在使用本应用前，应在监护人的指导下仔细阅读本政策，并征得监护人的同意。本应用不收集任何个人信息，如监护人对未成年人使用本应用有任何疑问，可通过下文联系方式与我们联系。
    </P>

    <H2>七、本政策的更新</H2>
    <P>
      我们可能会根据法律法规的更新或产品功能的调整，适时修订本隐私政策。修订后的政策将在应用内显著位置公示；当政策内容发生重大变更时，您再次启动应用时会重新收到同意提示。如您继续使用本应用，即表示您同意接受修订后的政策。
    </P>

    <H2>八、联系我们</H2>
    <P>如您对本隐私政策有任何疑问、意见或建议，或需要行使您的相关权利，请通过以下方式与我们联系：</P>
    <div className="bg-neutral-800/60 border border-neutral-700/60 rounded-xl p-4 mb-5">
      <p className="text-[13px] text-neutral-300">
        <strong className="text-neutral-100">电子邮箱</strong>：Jp112022@163.com
      </p>
    </div>

    <div className="mt-7 pt-5 border-t border-neutral-800 text-center">
      <p className="text-[12px] text-neutral-500 mb-1">感谢您使用意序填色！</p>
      <p className="text-[12px] text-neutral-500 mb-3">愿每一次落笔，都是一次轻松治愈的小憩。</p>
      <p className="text-[11px] text-neutral-600">© 2026 光年跃迁（温州）科技有限公司 版权所有</p>
    </div>
  </div>
);

export const UserAgreementContent: React.FC = () => (
  <div>
    <h1 className="text-xl font-bold text-[#4BA3A8] text-center mb-1.5">用户服务协议</h1>
    <p className="text-center text-[12px] text-neutral-500 mb-5">更新日期：2026年09月09日</p>

    <H2>1. 协议的接受</H2>
    <P>欢迎使用「意序填色」应用（以下简称「本应用」）。</P>
    <P>本协议是您与光年跃迁（温州）科技有限公司（以下简称「我们」）之间关于使用本应用的法律协议。</P>
    <P>在您首次启动本应用时，我们会提示您阅读并选择是否同意本协议及《隐私政策》。您点击「同意并继续」，或下载、安装、使用本应用，即表示您已充分理解并同意接受本协议的全部条款和条件；如您不同意，将无法使用本应用。</P>

    <H2>2. 服务内容</H2>
    <P>本应用是一款轻量治愈的填色解压创作工具，为您提供以下服务：</P>
    <ul className="list-disc pl-5 mb-4">
      <LI>丰富线稿模板的点触智能填色与自由画笔创作；</LI>
      <LI>多种笔触（马克笔、蜡笔、水彩、喷枪、荧光笔等）、橡皮擦与对称绘画；</LI>
      <LI>从相册导入图片并在本地提取线稿进行二次创作；</LI>
      <LI>贴纸、文字涂鸦、滤镜与相框装饰，以及创作过程回放；</LI>
      <LI>作品的本地保存、导出为图片、数据备份与迁移。</LI>
    </ul>

    <H2>3. 用户义务</H2>
    <P>作为本应用的用户，您同意：</P>
    <ul className="list-disc pl-5 mb-4">
      <LI>遵守本协议的所有条款及相关法律法规；</LI>
      <LI>对您导入应用的图片、素材内容享有合法权利，不导入侵犯他人知识产权、肖像权或含有违法违规内容的素材；</LI>
      <LI>不利用本应用从事任何违法活动，不干扰本应用的正常运行，不对本应用进行逆向工程、反编译或破解；</LI>
      <LI>妥善保管您的设备，并自行负责对重要作品进行备份。</LI>
    </ul>

    <H2>4. 知识产权</H2>
    <P>本应用内置的线稿模板、笔触效果、界面设计、图标、文案等内容，其知识产权均归我们或相关权利人所有，受知识产权法律法规保护。</P>
    <P>未经书面许可，您不得复制、修改、分发或商业使用上述内容。您使用本应用独立创作完成的填色作品，其著作权归您所有，您可自由保存、分享与使用。</P>

    <H2>5. 免责声明</H2>
    <P>本应用按「原样」提供，不做任何形式的明示或默示保证：</P>
    <ul className="list-disc pl-5 mb-4">
      <LI>我们不保证本应用将无中断、及时、安全或无错误地运行；</LI>
      <LI>因作品数据全部存储于您的设备本地，对于卸载应用、清除缓存、设备损坏或故障等原因导致的数据丢失，我们不承担责任，请您及时使用备份与导出功能；</LI>
      <LI>「图片提取线稿」等功能的处理效果受原图质量影响，我们不对识别结果的准确性作保证。</LI>
    </ul>

    <H2>6. 协议的终止</H2>
    <P>您可以随时停止使用本应用，或通过卸载本应用终止本协议，卸载后本地数据将被清除。</P>
    <P>如您违反本协议约定，我们有权随时终止或暂停您使用本应用。</P>

    <H2>7. 适用法律</H2>
    <P>本协议的订立、执行与解释均适用中华人民共和国法律。</P>
    <P>任何与本协议相关的争议，双方应首先友好协商解决；协商不成的，任何一方均可向温州市有管辖权的人民法院提起诉讼。</P>

    <div className="mt-7 pt-5 border-t border-neutral-800 text-center">
      <p className="text-[11px] text-neutral-600">© 2026 光年跃迁（温州）科技有限公司 版权所有</p>
    </div>
  </div>
);
