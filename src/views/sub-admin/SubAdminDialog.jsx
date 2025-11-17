import React, { useState, useEffect, forwardRef, useCallback } from 'react'

import { createUserWithEmailAndPassword, getAuth } from "firebase/auth";

import { useDispatch, useSelector } from 'react-redux'
import { debounce } from 'lodash'

import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
  CircularProgress,
  Autocomplete,
  Typography,
  Grid,
  InputAdornment,
  Slide,
  FormHelperText,
  FormControlLabel,
  Checkbox
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'

import { useForm, Controller } from 'react-hook-form'

import { toast } from 'react-toastify';

import DialogCloseButton from '@/components/dialogs/DialogCloseButton'
import { createSubAdmin, fetchSubAdmins, updateSubAdmin } from '@/redux-store/slices/subAdmin'

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

const defaultPermissions = [
  // === USER MANAGEMENT ===
  { section: "Users", canView: false, canEdit: false },
  { section: "Host Application", canView: false, canEdit: false },
  { section: "Host", canView: false, canEdit: false },
  { section: "Agency", canView: false, canEdit: false },
  { section: "Coin Trader", canView: false, canEdit: false },
  
  // === BANNER ===
  { section: "Splash", canView: false, canEdit: false },
  { section: "Home", canView: false, canEdit: false },
  { section: "Gift", canView: false, canEdit: false },
  { section: "Game", canView: false, canEdit: false },

  // GAME
  { section: "Game List", canView: false, canEdit: false },
  { section: "Game History", canView: false, canEdit: false },

  // === CONTENT ===
  { section: "Social Media Posts", canView: false, canEdit: false },
  { section: "Social Media Videos", canView: false, canEdit: false },
  { section: "Song Categories", canView: false, canEdit: false },
  { section: "Songs", canView: false, canEdit: false },
  { section: "Hashtags", canView: false, canEdit: false },

  // === ENGAGEMENT ===
  { section: "Gift Categories", canView: false, canEdit: false },
  { section: "Gifts", canView: false, canEdit: false },
  { section: "Store Rides", canView: false, canEdit: false },
  { section: "Store Themes", canView: false, canEdit: false },
  { section: "Store Frames", canView: false, canEdit: false },
  { section: "Reactions", canView: false, canEdit: false },

  // === PACKAGE ===
  { section: "Coin Plans", canView: false, canEdit: false },

  // === WEALTH ===
  { section: "Wealth Levels", canView: false, canEdit: false },

  // === SUPPORT & REPORTING ===
  { section: "Help", canView: false, canEdit: false },
  { section: "Reports", canView: false, canEdit: false },

  // === FINANCIAL ===
  { section: "Referral System", canView: false, canEdit: false },
  { section: "Payout Methods", canView: false, canEdit: false },
  { section: "Payout Request", canView: false, canEdit: false },
];

const SubAdminDialog = ({ open, onClose, editData, coinAdjustmentMode = false }) => {
  const dispatch = useDispatch()
  const { status, users, usersLoading,page,pageSize } = useSelector(state => state.subAdmin)
  const [permissions, setPermissions] = useState(defaultPermissions);
  const [loading, setLoading] = useState(false);

  const isEditMode = Boolean(editData)
  const isCoinAdjustmentMode = Boolean(coinAdjustmentMode && editData)

  const { settings } = useSelector(state => state.settings)

  // Form validation
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name : '',
      email : '',
      password : ''
    }
  })

  // Set form values when editing
   useEffect(() => {
    if (open && editData) {
      reset({
        name: editData.name,
        email: editData.email,
        password: editData.password, // Don’t prefill passwords
      });
      setPermissions(editData.permissions || defaultPermissions);
    } else {
      reset({ name: "", email: "", password: "" });
      setPermissions(defaultPermissions);
    }
  }, [open,editData, reset]);

   const handlePermissionChange = (section, field) => {
    setPermissions((prev) =>
      prev.map((perm) =>
        perm.section === section ? { ...perm, [field]: !perm[field] } : perm
      )
    );
  };

  // Handle form submission
  const onSubmit = async data => {
    try {
      setLoading(true);
      const auth = getAuth();

      // 1️⃣ Create user in Firebase (only for new)
      let uid = editData?.uid;

      if (!isEditMode) {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          data.email,
          data.password
        );

        uid = userCredential.user.uid;
      }

      let payload = {};

      if (isEditMode) {
      // Compare and add only changed fields
      if (data.name !== editData.name) payload.name = data.name;
      if (data.email !== editData.email) payload.email = data.email;
      if (data.password && data.password !== editData.password) payload.password = data.password;

      if (JSON.stringify(permissions) !== JSON.stringify(editData.permissions)) {
        payload.permissions = permissions;
      }

      await dispatch(updateSubAdmin({ id: editData._id, ...payload })).unwrap();
    } else {
      // For create, send everything
      payload = {
        uid,
        name: data.name,
        email: data.email,
        password: data.password,
        permissions,
      };
      const res = await dispatch(createSubAdmin(payload)).unwrap();

      if(res?.status){
      dispatch(
      fetchSubAdmins({
        page,
        pageSize,
      })
    )
      }
    }

    onClose();
    } catch (error) {
      console.error("Error:", error);

      if (error.code) {
      switch (error.code) {
        case "auth/email-already-in-use":
          toast.error("Email is already in use");
          break;
        case "auth/invalid-email":
          toast.error("Invalid email address");
          break;
        case "auth/weak-password":
          toast.error("Password should be at least 6 characters");
          break;
        default:
          toast.error(error.message);
      }
    }
    } finally {
      setLoading(false);
    }
  }

  // Render the appropriate title based on mode
  const getDialogTitle = () => {
    if (isEditMode) {
      return `Edit Sub Admin`
    } else {
      return 'Create Sub Admin'
    }
  }

  return (

    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      keepMounted
      TransitionComponent={Transition}
      PaperProps={{
        sx: {
          overflow: 'visible',
          width: '600px',
          maxWidth: '95vw',
          maxHeight : '800px'
        }
      }}
    >
      <DialogTitle>
        <Typography variant="h5">
          {getDialogTitle()}
        </Typography>
        <DialogCloseButton onClick={onClose}>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Controller
                name="name"
                control={control}
                rules={{ required: "Name is required" }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Name"
                    fullWidth
                    error={Boolean(errors.name)}
                    helperText={errors.name?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="email"
                control={control}
                rules={{
                  required: "Email is required",
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: "Invalid email",
                  },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Email"
                    type="email"
                    fullWidth
                    error={Boolean(errors.email)}
                    helperText={errors.email?.message}
                  />
                )}
              />
            </Grid>

              <Grid item xs={12}>
                <Controller
                  name="password"
                  control={control}
                  rules={{
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Password"
                      type="text"
                      fullWidth
                      error={Boolean(errors.password)}
                      helperText={errors.password?.message}
                    />
                  )}
                />
              </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ my: 3 }}>
                Permissions:
              </Typography>
              {permissions.map((perm) => (
                <Grid
                  container
                  key={perm.section}
                  alignItems="center"
                  spacing={2}
                  sx={{ mb: 1 }}
                >
                  <Grid item xs={4}>
                    <Typography>{perm.section}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={perm.canView}
                          onChange={() =>
                            handlePermissionChange(perm.section, "canView")
                          }
                        />
                      }
                      label="View"
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={perm.canEdit}
                          onChange={() =>
                            handlePermissionChange(perm.section, "canEdit")
                          }
                        />
                      }
                      label="Edit"
                    />
                  </Grid>
                </Grid>
              ))}
            </Grid>

            <Grid
              item
              xs={12}
              sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}
            >
              <Button onClick={onClose} sx={{ mr: 2 }}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={
                  loading && <CircularProgress size={20} color="inherit" />
                }
              >
                {loading
                  ? isEditMode
                    ? "Updating..."
                    : "Creating..."
                  : isEditMode
                  ? "Update"
                  : "Create"}
              </Button>
            </Grid>
          </Grid>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default SubAdminDialog;
