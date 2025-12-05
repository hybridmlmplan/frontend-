useEffect(() => {
  let mounted = true;

  setLoading(true);

  API.get("/user/me")
    .then((res) => {
      if (!mounted) return;

      const user = res.data?.user;

      if (!user) {
        setUser(null);
        return;
      }

      setUser(user);

      setForm({
        name: user.name || "",
        email: user.email || "",
        mobile: user.phone || "",
      });
    })
    .catch((err) => {
      console.error("Profile load error:", err.response?.data || err.message);
      if (mounted) setUser(null);
    })
    .finally(() => {
      if (mounted) setLoading(false);
    });

  return () => {
    mounted = false;
  };
}, []);
