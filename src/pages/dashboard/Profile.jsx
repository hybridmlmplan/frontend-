import { useState, useEffect } from "react";
import API from "../../utils/axiosInstance";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    API.get("/user/me")
      .then((res) => {
        if (!res.data?.user) {
          setUser(null);
        } else {
          setUser(res.data.user);
          setForm({
            name: res.data.user.name || "",
            email: res.data.user.email || "",
            mobile: res.data.user.phone || res.data.user.mobile || "",
          });
        }
      })
      .catch((err) => {
        console.log("Profile load error", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>No user found</div>;
  }

  return (
    <div>
      <h2>Profile</h2>

      <p>
        <strong>Name:</strong> {form.name}
      </p>

      <p>
        <strong>Email:</strong> {form.email}
      </p>

      <p>
        <strong>Mobile:</strong> {form.mobile}
      </p>
    </div>
  );
};

export default Profile;
