import Footer from "@/components/footer";
import Header from "@/components/header";

const LayoutMain = ({ children }: LayoutProps<"/">) => {
  return (
    <div className="w-full h-full">
      <Header />
      <div className="w-full h-full min-h-screen">{children}</div>
      <Footer />
    </div>
  );
};

export default LayoutMain;
