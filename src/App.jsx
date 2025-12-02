element={
              <PrivateRoute>
                <EpinTransfer />
              </PrivateRoute>
            }
          />

          {/* Franchise */}
          <Route
            path="/franchise"
            element={
              <PrivateRoute>
                <FranchiseDashboard />
              </PrivateRoute>
            }
          />

          {/* Default Redirect */}
          <Route path="*" element={<Navigate to="/login" />} />

        </Routes>
      </AuthProv
