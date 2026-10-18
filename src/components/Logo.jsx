import logo from '../assets/logo.png';

export default function Logo({ hideWord }) {
  return (
    <div className="logo">
      <img className="logo-img" src={logo} alt="" />
      {hideWord ? null : <span className="w">Heard</span>}
    </div>
  );
}
