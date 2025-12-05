useEffect(() => {
  API.get("/user/me")
    .then((res) => {
      if (!res.data?.user) {
        setUser(null);
      } else {
        setUser(res.data.user);
        setForm({
          name: res.data.user.name || "",
          email: res.data.user.email || "",
          mobile: res.data.user.mobile || "",
        });
      }
      setLoading(false);
    })
    .catch((err) => {
      console.log("Profile load error", err);
      setLoading(false);
    });
}, []);
